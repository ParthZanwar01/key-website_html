// Clear Google Drive Authentication Script
// Run this in the browser console to clear all authentication data

console.log('🧹 Clearing Google Drive Authentication...');

// Clear all OAuth-related localStorage items
const itemsToClear = [
  'google_drive_access_token',
  'google_drive_refresh_token', 
  'google_drive_token_expiry',
  'google_drive_user_info',
  'oauth_code',
  'oauth_code_verifier',
  'oauth_state',
  'oauth_return_url',
  'oauth_start_time'
];

let clearedCount = 0;

itemsToClear.forEach(item => {
  if (localStorage.getItem(item)) {
    localStorage.removeItem(item);
    console.log(`✅ Cleared: ${item}`);
    clearedCount++;
  } else {
    console.log(`ℹ️ Not found: ${item}`);
  }
});

console.log(`\n🎉 Authentication cleared! Removed ${clearedCount} items.`);
console.log('\n📝 Next steps:');
console.log('1. Refresh the page');
console.log('2. Click "Connect Google Drive" to authenticate again');
console.log('3. Complete the OAuth flow in the popup window');
console.log('4. Make sure to allow all requested permissions');

// Also clear any sessionStorage items
console.log('\n🧹 Clearing sessionStorage...');
sessionStorage.clear();
console.log('✅ SessionStorage cleared');

console.log('\n✅ All done! You can now try authenticating again.'); 