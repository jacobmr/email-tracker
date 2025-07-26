// Background script for the Email Tracker extension
console.log('Email Tracker background script loaded');

// Listen for installation event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Extension was just installed
    console.log('Email Tracker extension installed');
    
    // Open the dashboard in a new tab
    chrome.tabs.create({
      url: 'https://e.brasilito.org/dashboard'
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackEmail') {
    // Handle email tracking request
    console.log('Tracking email:', request.emailId);
    // In a real implementation, you might want to store this in chrome.storage
  }
  return true; // Required for async response
});
