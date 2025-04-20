// Chrome extension background script
// This script runs in the background and is used to handle events

// Listen for installation event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle any background events here if needed
  if (message.action === 'getFormData') {
    chrome.storage.local.get('userData', (result) => {
      sendResponse(result);
    });
    return true; // Required to use sendResponse asynchronously
  }
}); 