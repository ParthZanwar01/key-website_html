export async function handler(event, context) {
  console.log('🚀 gasProxy function called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body length:', event.body ? event.body.length : 0);
  
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwd6UbjjETvgtGUV7T5jv2oNnQbYsujX8v2FvqrrcjZZUPpm5y2hAXvOUX7Eyh2llmjvg/exec";

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    console.log('✅ Handling OPTIONS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  // Validate HTTP method
  if (event.httpMethod !== "POST") {
    console.log('❌ Invalid HTTP method:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: "Method not allowed",
        allowedMethods: ["POST", "OPTIONS"]
      }),
    };
  }

  try {
    console.log('📤 Forwarding request to Google Apps Script...');
    
    // Validate request body
    if (!event.body) {
      console.log('❌ No request body provided');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Request body is required" 
        }),
      };
    }

    // FIXED: Parse JSON body properly
    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('✅ Successfully parsed JSON request body');
      console.log('📋 Request data keys:', Object.keys(requestData));
    } catch (parseError) {
      console.error('❌ Failed to parse JSON body:', parseError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: parseError.message
        }),
      };
    }

    // Check if this is a connection test
    if (requestData.requestType === 'connectionTest') {
      console.log('🧪 Connection test request detected');
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          message: 'Netlify function is working',
          timestamp: new Date().toISOString(),
          gasUrl: GOOGLE_SCRIPT_URL
        }),
      };
    }

    // FIXED: Forward JSON directly to Google Apps Script (no form conversion needed)
    console.log('📤 Forwarding JSON request to Google Apps Script...');
    
    // For Google Apps Script, we'll send the JSON directly
    console.log('🌐 Sending to:', GOOGLE_SCRIPT_URL);
    
    const fetchOptions = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Netlify-Function/1.0",
      },
      body: JSON.stringify(requestData), // Send JSON directly to Google Apps Script
    };

    console.log('Fetch options prepared - sending JSON payload');

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📨 Google Apps Script response status:', response.status);
    console.log('📨 Google Apps Script response headers:', JSON.stringify([...response.headers.entries()]));

    // Get response text
    const responseText = await response.text();
    console.log('📨 Google Apps Script response text length:', responseText.length);
    console.log('📨 Google Apps Script response preview:', responseText.substring(0, 500));

    // Check if response is successful
    if (!response.ok) {
      console.error('❌ Google Apps Script returned error:', response.status, responseText);
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Google Apps Script error",
          status: response.status,
          message: responseText.substring(0, 1000) // Limit error message length
        }),
      };
    }

    // Try to parse as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.warn('⚠️ Response is not valid JSON, treating as text:', parseError.message);
      parsedResponse = {
        success: false,
        error: "Invalid response format from Google Apps Script",
        rawResponse: responseText.substring(0, 1000)
      };
    }

    // Return successful response
    console.log('✅ Returning successful response');
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedResponse),
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific error types
    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error.name === 'AbortError') {
      errorMessage = "Request timeout - Google Apps Script took too long to respond";
      statusCode = 504;
    } else if (error.message.includes('fetch')) {
      errorMessage = "Failed to connect to Google Apps Script";
      statusCode = 502;
    } else {
      errorMessage = error.message;
    }

    return {
      statusCode: statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.name,
        timestamp: new Date().toISOString()
      }),
    };
  }
}