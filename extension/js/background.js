// Background script for the Email Tracker extension
console.log('Email Tracker background script loaded');

// Configuration
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Email Tracker Background]', ...args);
  }
}

// Track active Gmail tabs
const gmailTabs = new Set();

// Listen for installation event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    debugLog('Extension installed');
    // Open the dashboard in a new tab
    chrome.tabs.create({
      url: 'https://e.brasilito.org/dashboard'
    });
  } else if (details.reason === 'update') {
    debugLog(`Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
  }
});

// Listen for tab updates to detect Gmail tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('mail.google.com')) {
    debugLog('Gmail tab detected:', tabId, tab.url);
    gmailTabs.add(tabId);
    
    // Inject content script
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['js/content.js']
    }).catch(err => {
      debugLog('Failed to inject content script:', err);
    });
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  gmailTabs.delete(tabId);
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('Received message:', request, 'from:', sender);
  
  if (request.type === 'PING') {
    sendResponse({ status: 'pong' });
    return true;
  }
  
  if (request.action === 'trackEmail') {
    // Handle email tracking request
    console.log('Tracking email:', request.emailId);
    // In a real implementation, you might want to store this in chrome.storage
  }
  return true; // Required for async response
});
