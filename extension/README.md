# Email Tracker Chrome Extension

This Chrome extension adds email tracking to Gmail by automatically inserting a tracking pixel into outgoing emails.

## Features

- Automatically adds tracking pixels to outgoing Gmail emails
- Tracks when emails are opened
- Works seamlessly with your existing Gmail workflow

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `extension` directory from this repository

### For Production

1. Download the latest release ZIP file from the dashboard
2. Unzip the file to a directory of your choice
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the unzipped directory

## How It Works

1. The extension automatically detects when you're composing an email in Gmail
2. When you send an email, it adds an invisible tracking pixel
3. When the recipient opens the email, the pixel is loaded from our server
4. The dashboard is updated in real-time with open/click statistics

## Permissions

- `storage`: For storing user preferences
- `activeTab`: To interact with Gmail's compose window
- `scripting`: To inject the tracking pixel
- `https://mail.google.com/*`: To access Gmail
- `https://track.brasilito.org/*`: To load tracking pixels

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Find the Email Tracker extension
4. Click the refresh icon to reload the extension with your changes

## Building for Production

To create a production build:

```bash
zip -r email-tracker-extension.zip extension/
```

This will create a ZIP file that can be distributed and installed as an unpacked extension.
