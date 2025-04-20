document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const profileForm = document.getElementById('profileForm');
  const saveButton = document.getElementById('saveButton');
  const clearButton = document.getElementById('clearButton');
  const savedNotice = document.getElementById('savedNotice');
  const experienceContainer = document.getElementById('experienceContainer');
  const educationContainer = document.getElementById('educationContainer');
  const addExperienceBtn = document.getElementById('addExperience');
  const addEducationBtn = document.getElementById('addEducation');
  const resumeInput = document.getElementById('resume');
  const currentResumeDisplay = document.getElementById('currentResume');
  
  let resumeFile = null;
  
  // Load saved data when the page loads
  loadSavedData();
  
  // Add experience template
  function createExperienceTemplate(data = {}) {
    const experienceDiv = document.createElement('div');
    experienceDiv.className = 'dynamic-list';
    
    experienceDiv.innerHTML = `
      <div class="form-group">
        <label for="expTitle">Job Title:</label>
        <input type="text" class="expTitle" value="${data.title || ''}">
      </div>
      
      <div class="form-group">
        <label for="expCompany">Company:</label>
        <input type="text" class="expCompany" value="${data.company || ''}">
      </div>
      
      <div class="form-group">
        <label for="expLocation">Office Location:</label>
        <input type="text" class="expLocation" value="${data.location || ''}">
      </div>
      
      <div class="form-group">
        <label for="expDescription">Description:</label>
        <textarea class="expDescription">${data.description || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="expFromDate">From Date:</label>
        <input type="month" class="expFromDate" value="${data.fromDate || ''}">
      </div>
      
      <div class="form-group">
        <label for="expToDate">To Date:</label>
        <input type="month" class="expToDate" value="${data.toDate || ''}" ${data.current ? 'disabled' : ''}>
      </div>
      
      <div class="checkbox-container">
        <input type="checkbox" class="expCurrentCheckbox" ${data.current ? 'checked' : ''}>
        <label>I currently work here</label>
      </div>
      
      <button type="button" class="delete-btn">Delete</button>
    `;
    
    // Add event listener to the "I currently work here" checkbox
    const currentCheckbox = experienceDiv.querySelector('.expCurrentCheckbox');
    const toDateInput = experienceDiv.querySelector('.expToDate');
    
    currentCheckbox.addEventListener('change', function() {
      toDateInput.disabled = this.checked;
      if (this.checked) {
        toDateInput.value = '';
      }
    });
    
    // Add event listener to the delete button
    const deleteButton = experienceDiv.querySelector('.delete-btn');
    deleteButton.addEventListener('click', function() {
      experienceDiv.remove();
    });
    
    return experienceDiv;
  }
  
  // Add education template
  function createEducationTemplate(data = {}) {
    const educationDiv = document.createElement('div');
    educationDiv.className = 'dynamic-list';
    
    educationDiv.innerHTML = `
      <div class="form-group">
        <label for="eduInstitution">Institution:</label>
        <input type="text" class="eduInstitution" value="${data.institution || ''}">
      </div>
      
      <div class="form-group">
        <label for="eduMajor">Major:</label>
        <input type="text" class="eduMajor" value="${data.major || ''}">
      </div>
      
      <div class="form-group">
        <label for="eduDegree">Degree:</label>
        <input type="text" class="eduDegree" value="${data.degree || ''}">
      </div>
      
      <div class="form-group">
        <label for="eduLocation">Location:</label>
        <input type="text" class="eduLocation" value="${data.location || ''}">
      </div>
      
      <div class="form-group">
        <label for="eduDescription">Description:</label>
        <textarea class="eduDescription">${data.description || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="eduFromDate">From Date:</label>
        <input type="month" class="eduFromDate" value="${data.fromDate || ''}">
      </div>
      
      <div class="form-group">
        <label for="eduToDate">To Date:</label>
        <input type="month" class="eduToDate" value="${data.toDate || ''}" ${data.current ? 'disabled' : ''}>
      </div>
      
      <div class="checkbox-container">
        <input type="checkbox" class="eduCurrentCheckbox" ${data.current ? 'checked' : ''}>
        <label>I currently attend here</label>
      </div>
      
      <button type="button" class="delete-btn">Delete</button>
    `;
    
    // Add event listener to the "I currently attend here" checkbox
    const currentCheckbox = educationDiv.querySelector('.eduCurrentCheckbox');
    const toDateInput = educationDiv.querySelector('.eduToDate');
    
    currentCheckbox.addEventListener('change', function() {
      toDateInput.disabled = this.checked;
      if (this.checked) {
        toDateInput.value = '';
      }
    });
    
    // Add event listener to the delete button
    const deleteButton = educationDiv.querySelector('.delete-btn');
    deleteButton.addEventListener('click', function() {
      educationDiv.remove();
    });
    
    return educationDiv;
  }
  
  // Add event listeners to add experience and education buttons
  addExperienceBtn.addEventListener('click', function() {
    experienceContainer.appendChild(createExperienceTemplate());
  });
  
  addEducationBtn.addEventListener('click', function() {
    educationContainer.appendChild(createEducationTemplate());
  });
  
  // Handle resume file upload
  resumeInput.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      const file = this.files[0];
      
      reader.onload = function(event) {
        resumeFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result
        };
        
        currentResumeDisplay.textContent = `Current resume: ${file.name}`;
      };
      
      reader.readAsDataURL(file);
    }
  });
  
  // Save all data
  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect personal information
    const personalInfo = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      confirmEmail: document.getElementById('confirmEmail').value,
      city: document.getElementById('city').value,
      phone: document.getElementById('phone').value,
      messageToHiringTeam: document.getElementById('messageToHiringTeam').value
    };
    
    // Collect experience information
    const experiences = [];
    document.querySelectorAll('#experienceContainer .dynamic-list').forEach(function(exp) {
      experiences.push({
        title: exp.querySelector('.expTitle').value,
        company: exp.querySelector('.expCompany').value,
        location: exp.querySelector('.expLocation').value,
        description: exp.querySelector('.expDescription').value,
        fromDate: exp.querySelector('.expFromDate').value,
        toDate: exp.querySelector('.expToDate').value,
        current: exp.querySelector('.expCurrentCheckbox').checked
      });
    });
    
    // Collect education information
    const educations = [];
    document.querySelectorAll('#educationContainer .dynamic-list').forEach(function(edu) {
      educations.push({
        institution: edu.querySelector('.eduInstitution').value,
        major: edu.querySelector('.eduMajor').value,
        degree: edu.querySelector('.eduDegree').value,
        location: edu.querySelector('.eduLocation').value,
        description: edu.querySelector('.eduDescription').value,
        fromDate: edu.querySelector('.eduFromDate').value,
        toDate: edu.querySelector('.eduToDate').value,
        current: edu.querySelector('.eduCurrentCheckbox').checked
      });
    });
    
    // Collect social profile information
    const socialProfiles = {
      linkedin: document.getElementById('linkedin').value,
      facebook: document.getElementById('facebook').value,
      twitter: document.getElementById('twitter').value,
      website: document.getElementById('website').value
    };
    
    // Save all data to chrome.storage
    const userData = {
      personalInfo,
      experiences,
      educations,
      socialProfiles,
      resume: resumeFile,
      lastUpdated: new Date().toISOString()
    };
    
    chrome.storage.local.set({ userData }, function() {
      // Show the saved notice
      savedNotice.style.display = 'block';
      
      // Hide the notice after 3 seconds
      setTimeout(function() {
        savedNotice.style.display = 'none';
      }, 3000);
    });
  });
  
  // Clear all data
  clearButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all your saved data? This cannot be undone.')) {
      chrome.storage.local.remove('userData', function() {
        // Reset all form fields
        profileForm.reset();
        
        // Clear experience and education containers
        experienceContainer.innerHTML = '';
        educationContainer.innerHTML = '';
        
        // Reset resume display
        resumeFile = null;
        currentResumeDisplay.textContent = '';
        
        // Show notice
        savedNotice.textContent = 'All data has been cleared!';
        savedNotice.style.display = 'block';
        
        setTimeout(function() {
          savedNotice.style.display = 'none';
          savedNotice.textContent = 'Your information has been saved successfully!';
        }, 3000);
      });
    }
  });
  
  // Function to load saved data
  function loadSavedData() {
    chrome.storage.local.get('userData', function(result) {
      if (result.userData) {
        const data = result.userData;
        
        // Load personal information
        if (data.personalInfo) {
          document.getElementById('firstName').value = data.personalInfo.firstName || '';
          document.getElementById('lastName').value = data.personalInfo.lastName || '';
          document.getElementById('email').value = data.personalInfo.email || '';
          document.getElementById('confirmEmail').value = data.personalInfo.confirmEmail || '';
          document.getElementById('city').value = data.personalInfo.city || '';
          document.getElementById('phone').value = data.personalInfo.phone || '';
          document.getElementById('messageToHiringTeam').value = data.personalInfo.messageToHiringTeam || '';
        }
        
        // Load experiences
        if (data.experiences && data.experiences.length > 0) {
          data.experiences.forEach(function(exp) {
            experienceContainer.appendChild(createExperienceTemplate(exp));
          });
        }
        
        // Load educations
        if (data.educations && data.educations.length > 0) {
          data.educations.forEach(function(edu) {
            educationContainer.appendChild(createEducationTemplate(edu));
          });
        }
        
        // Load social profiles
        if (data.socialProfiles) {
          document.getElementById('linkedin').value = data.socialProfiles.linkedin || '';
          document.getElementById('facebook').value = data.socialProfiles.facebook || '';
          document.getElementById('twitter').value = data.socialProfiles.twitter || '';
          document.getElementById('website').value = data.socialProfiles.website || '';
        }
        
        // Load resume file
        if (data.resume) {
          resumeFile = data.resume;
          currentResumeDisplay.textContent = `Current resume: ${data.resume.name}`;
        }
      }
    });
  }
}); 