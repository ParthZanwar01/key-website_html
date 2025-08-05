# Google Maps API Setup Guide

## Quick Setup Steps

### 1. Get Your API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API**
4. Create credentials → API Key
5. Copy your API key

### 2. Add API Key to Your App
1. Open `config/googleMaps.js`
2. Replace `'YOUR_ACTUAL_API_KEY_HERE'` with your actual API key
3. Save the file

### 3. Test the Integration
1. Run your app
2. Go to Event Creation screen
3. Tap the location field
4. Try searching for a location
5. You should see real Google Places results!

## API Key Security

### For Development:
- Add `localhost:19006` to HTTP referrers
- Restrict to only the APIs you need

### For Production:
- Add your actual domain to HTTP referrers
- Set up proper API restrictions
- Consider using environment variables

## Troubleshooting

### "API key not valid" error:
- Check if the API key is correct
- Verify the APIs are enabled
- Check API key restrictions

### "Quota exceeded" error:
- Google provides free tier with limits
- Check usage in Google Cloud Console
- Consider upgrading if needed

### No search results:
- Check browser console for errors
- Verify API key is properly set
- Ensure Places API is enabled

## Cost Information

Google Maps APIs have a generous free tier:
- **Places API**: $200 free credit per month
- **Maps JavaScript API**: $200 free credit per month
- **Geocoding API**: $200 free credit per month

For most small to medium apps, the free tier is sufficient.

## Environment Variables (Optional)

For better security, you can use environment variables:

1. Create `.env` file in your project root:
```
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

2. Update `config/googleMaps.js`:
```javascript
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_ACTUAL_API_KEY_HERE';
```

3. Add `.env` to your `.gitignore` file to keep it secure.

## Support

If you encounter issues:
1. Check the Google Cloud Console for error messages
2. Verify your API key and restrictions
3. Test with a simple API call first
4. Check the browser console for detailed error messages 