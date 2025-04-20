document.addEventListener('DOMContentLoaded', function() {
  // Get buttons from the popup
  const fillFormButton = document.getElementById('fillForm');
  const fillPersonalButton = document.getElementById('fillPersonal');
  const fillExperienceButton = document.getElementById('fillExperience');
  const fillEducationButton = document.getElementById('fillEducation');
  const fillSocialButton = document.getElementById('fillSocial');
  const statusDiv = document.getElementById('status');

  // Function to show status message
  function showStatus(message, isSuccess = true) {
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'status success' : 'status error';
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // Auto-fill all form fields
  fillFormButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillAll"}, function(response) {
        if (response && response.success) {
          showStatus(`Filled ${response.filledCount || 0} fields successfully!`);
        } else {
          showStatus('Failed to fill form. Try again.', false);
        }
      });
    });
  });

  // Auto-fill only personal information
  fillPersonalButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillPersonal"}, function(response) {
        if (response && response.success) {
          showStatus(`Filled ${response.filledCount || 0} personal fields!`);
        } else {
          showStatus('Failed to fill personal info.', false);
        }
      });
    });
  });

  // Auto-fill only experience information
  fillExperienceButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillExperience"}, function(response) {
        if (response && response.success) {
          showStatus(`Filled ${response.filledCount || 0} experience fields!`);
        } else {
          showStatus('Failed to fill experience info.', false);
        }
      });
    });
  });

  // Auto-fill only education information
  fillEducationButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillEducation"}, function(response) {
        if (response && response.success) {
          showStatus(`Filled ${response.filledCount || 0} education fields!`);
        } else {
          showStatus('Failed to fill education info.', false);
        }
      });
    });
  });

  // Auto-fill only social profile information
  fillSocialButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillSocial"}, function(response) {
        if (response && response.success) {
          showStatus(`Filled ${response.filledCount || 0} social profile fields!`);
        } else {
          showStatus('Failed to fill social info.', false);
        }
      });
    });
  });
}); 