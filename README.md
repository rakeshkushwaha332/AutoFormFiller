# Auto Form Filler - Chrome Extension

A Chrome extension that helps you automatically fill in job application forms on company career pages with your stored information.

## Features

- **Form Auto-Fill on Click**: Automatically fills in common job application form fields with your stored data
- **Smart Field Detection**: Uses advanced matching to identify form fields even on sites with inconsistent naming
- **Sectional Filling**: Fill only specific sections (Personal Info, Experience, Education, Social Profiles)
- **Multiple Experience/Education Entries**: Supports adding multiple work experiences and education entries
- **Resume Upload**: Automatically uploads your saved resume to file input fields
- **Secure Local Storage**: All your data is stored securely in your browser's local storage and never sent externally

## Installation

### From Chrome Web Store
*(Note: This extension is not yet published to the Chrome Web Store)*

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now be installed and visible in your toolbar

## How to Use

1. **Initial Setup**:
   - After installation, click on the extension icon in your Chrome toolbar
   - Select "Edit Profile Info" to open the settings page
   - Fill in your personal information, work experiences, education, and social profiles
   - Upload your resume
   - Click "Save Information" to store your data

2. **Using the Extension**:
   - Navigate to a job application page
   - Click the extension icon in your Chrome toolbar
   - Click "Auto-fill this application" to fill the entire form
   - Or use the individual section buttons to fill specific parts of the application

3. **Viewing Results**:
   - After filling, the extension will show how many fields were successfully filled
   - Review the form before submission to make any necessary adjustments

## Security

- All your data is stored locally in your browser using Chrome's storage API
- No data is ever sent to any external servers
- Your information never leaves your computer

## Compatibility

This extension is designed to work with common job application platforms including:
- Lever
- Greenhouse
- Workday
- Custom HR portals

The field detection logic is flexible and should work on most standard HTML forms.

## Support

If you encounter any issues or have suggestions for improvements, please file an issue on the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details. "# AutoFormFiller" 
