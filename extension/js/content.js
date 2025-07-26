// Content script to inject tracking pixel into Gmail emails
console.log('Email Tracker content script loaded');

// Configuration
const API_BASE_URL = 'https://e.brasilito.org/api';
const DEBUG = true; // Set to false in production

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Email Tracker]', ...args);
  }
}

// Track if we've already set up listeners for a compose window
const processedComposeWindows = new WeakSet();

// Function to get the recipient's email from the compose window
function getRecipientEmail(composeBox) {
  // Try to find the recipient input field in Gmail's compose window
  const toInput = composeBox.querySelector('input[type="text"][name="to"]') ||
                 composeBox.querySelector('textarea[name="to"]');
  
  if (toInput) {
    return toInput.value.trim();
  }
  
  // Try alternative selectors for different Gmail interfaces
  const toElement = composeBox.querySelector('[data-tooltip*="Add recipients"], [name="to"]');
  if (toElement) {
    // For newer Gmail interface, the email might be in a hidden input
    const hiddenInput = toElement.querySelector('input[type="hidden"]');
    if (hiddenInput && hiddenInput.value) {
      return hiddenInput.value;
    }
    return toElement.textContent.trim();
  }
  
  return ''; // Return empty if we can't find the recipient
}

// Function to get the email subject
function getEmailSubject(composeBox) {
  const subjectInput = composeBox.querySelector('input[name="subjectbox"], input[name="subject"]');
  return subjectInput ? subjectInput.value.trim() : '(No subject)';
}

// Function to get the email content
function getEmailContent(composeBox) {
  const editor = composeBox.querySelector('div[role="textbox"], div[g_editable="true"]');
  return editor ? editor.innerHTML : '';
}

// Function to add tracking pixel to email
async function addTrackingPixel(composeBox) {
  try {
    // Only proceed if we have a valid compose box
    if (!composeBox) return;
    
    // Get email details
    const recipient = getRecipientEmail(composeBox);
    const subject = getEmailSubject(composeBox);
    const content = getEmailContent(composeBox);
    
    if (!recipient) {
      console.log('No recipient found, skipping tracking pixel');
      return;
    }
    
    console.log('Preparing to track email to:', recipient);
    
    // Call our backend to get a tracking pixel URL
    const response = await fetch(`${API_BASE_URL}/emails/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        recipient,
        content: content.substring(0, 5000) // Limit content size
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.trackingPixelUrl) {
      throw new Error('No tracking pixel URL in response');
    }
    
    console.log('Received tracking pixel URL:', data.trackingPixelUrl);
    
    // Create the tracking pixel image
    const trackingPixel = document.createElement('img');
    trackingPixel.src = data.trackingPixelUrl;
    trackingPixel.style.width = '1px';
    trackingPixel.style.height = '1px';
    trackingPixel.style.opacity = '0.01';
    trackingPixel.alt = '';
    trackingPixel.setAttribute('aria-hidden', 'true');
    
    // Add the tracking pixel to the email
    const editor = composeBox.querySelector('div[role="textbox"], div[g_editable="true"]');
    if (editor) {
      // Insert at the end of the email content
      editor.appendChild(document.createElement('br'));
      editor.appendChild(trackingPixel);
      console.log('Added tracking pixel to email');
    } else {
      console.warn('Could not find email editor to insert tracking pixel');
    }
    
  } catch (error) {
    console.error('Error adding tracking pixel:', error);
  }
}

// Watch for send button clicks to add tracking pixel before sending
function setupSendButtonListener() {
  document.addEventListener('click', async (event) => {
    try {
      // Check if this is a send button click
      const sendButton = event.target.closest('div[role="button"][aria-label*="Send" i]');
      if (!sendButton) return;
      
      console.log('Send button clicked, adding tracking pixel...');
      
      // Find the compose window
      const composeWindow = sendButton.closest('[role="dialog"]');
      if (!composeWindow) return;
      
      // Add tracking pixel
      await addTrackingPixel(composeWindow);
      
      // Small delay to ensure tracking pixel is added before sending
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Tracking pixel added, proceeding with send...');
      
    } catch (error) {
      console.error('Error in send button handler:', error);
    }
  }, true); // Use capture phase to catch the event before Gmail does
}

// Watch for Gmail's dynamic content loading
function setupObservers() {
  debugLog('Setting up observers');
  
  // Watch for new compose windows
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Check if this is a compose window
        if (node.nodeType === 1 && node.getAttribute) {
          // Check for compose window in various Gmail interfaces
          const composeBox = node.querySelector && (
            node.querySelector('[role="dialog"][aria-label*="Compose"]') ||
            node.querySelector('[role="dialog"]')
          );
          
          if (composeBox && !processedComposeWindows.has(composeBox)) {
            processedComposeWindows.add(composeBox);
            debugLog('New compose window detected', composeBox);
            
            // Setup send button listener for this compose window
            setupSendButtonListener(composeBox);
            
            // Also watch for changes within the compose window
            const composeObserver = new MutationObserver((mutations) => {
              // Re-attach listeners if the compose window was recreated
              if (!document.body.contains(composeBox)) {
                processedComposeWindows.delete(composeBox);
                composeObserver.disconnect();
                return;
              }
            });
            
            composeObserver.observe(composeBox, {
              childList: true,
              subtree: true
            });
          }
        }
      });
    });
  });
  
  // Start observing the entire document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  debugLog('Observers set up');
  return observer;
}

// Initialize the extension
function init() {
  debugLog('Initializing Email Tracker');
  
  // Check if we're in Gmail
  if (!window.location.href.includes('mail.google.com')) {
    debugLog('Not in Gmail, skipping initialization');
    return;
  }
  
  // Wait for Gmail to load
  if (document.readyState === 'loading') {
    debugLog('Document still loading, waiting...');
    document.addEventListener('DOMContentLoaded', setupObservers);
  } else {
    debugLog('Document ready, setting up observers');
    setupObservers();
  }
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      debugLog('Received ping from background script');
      sendResponse({ status: 'pong' });
    }
  });
  
  debugLog('Email Tracker content script initialized');
}

// Start the extension
init();
