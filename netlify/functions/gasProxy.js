export async function handler(event) {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwd6UbjjETvgtGUV7T5jv2oNnQbYsujX8v2FvqrrcjZZUPpm5y2hAXvOUX7Eyh2llmjvg/exec";

  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://crhskeyclub.netlify.app",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  try {
    // Forward the request to Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: event.httpMethod,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: event.body,
    });

    const text = await response.text();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://crhskeyclub.netlify.app",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://crhskeyclub.netlify.app",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
