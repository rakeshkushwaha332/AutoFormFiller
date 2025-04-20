// Content script that runs on the web pages
// Handles form detection and auto-filling

// Helper functions for form field detection and filling
const FormFiller = {
  userData: null,
  filledFields: 0,
  
  // Initialize user data
  init: function(callback) {
    chrome.runtime.sendMessage({action: 'getFormData'}, (response) => {
      if (response && response.userData) {
        this.userData = response.userData;
        if (callback) callback();
      } else {
        console.warn('No user data found. Please fill your profile information.');
      }
    });
  },
  
  // Reset the filled fields counter
  resetCounter: function() {
    this.filledFields = 0;
  },
  
  // Fill all form fields
  fillAll: function() {
    this.resetCounter();
    
    if (!this.userData) {
      console.warn('No user data available to fill forms');
      return { success: false, message: 'No user data available' };
    }
    
    // Fill each category
    this.fillPersonalInfo();
    this.fillExperience();
    this.fillEducation();
    this.fillSocialProfiles();
    this.uploadResume();
    
    return { 
      success: true, 
      filledCount: this.filledFields,
      message: `Successfully filled ${this.filledFields} fields` 
    };
  },
  
  // Generic function to find and fill an input field
  findAndFillField: function(selectors, value) {
    if (!value) return false;
    
    // Try each selector in the array
    for (const selector of selectors) {
      // Try various attribute selectors
      const possibleElements = [
        // By ID
        ...document.querySelectorAll(`#${selector}, [id*="${selector}"]`),
        // By name
        ...document.querySelectorAll(`[name="${selector}"], [name*="${selector}"]`),
        // By placeholder
        ...document.querySelectorAll(`[placeholder*="${selector}" i]`),
        // By label
        ...Array.from(document.querySelectorAll('label')).filter(label => 
          label.textContent.toLowerCase().includes(selector.toLowerCase())
        ).map(label => {
          // Get associated input via for attribute
          if (label.htmlFor) {
            return document.getElementById(label.htmlFor);
          }
          // Get input within the label
          return label.querySelector('input, textarea, select');
        }).filter(el => el)
      ];
      
      for (const element of possibleElements) {
        if (element && !element.disabled && !element.readOnly) {
          // Fill the element
          if (element.tagName === 'SELECT') {
            // For dropdown/select elements
            for (let i = 0; i < element.options.length; i++) {
              if (element.options[i].text.toLowerCase().includes(value.toLowerCase())) {
                element.selectedIndex = i;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                this.filledFields++;
                return true;
              }
            }
          } else if (element.type === 'checkbox') {
            element.checked = !!value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            this.filledFields++;
            return true;
          } else if (element.type === 'radio') {
            // For radio buttons
            const name = element.name;
            if (name) {
              const radios = document.querySelectorAll(`input[name="${name}"]`);
              for (const radio of radios) {
                if (radio.value.toLowerCase() === value.toLowerCase() || 
                    radio.nextSibling?.textContent?.toLowerCase().includes(value.toLowerCase())) {
                  radio.checked = true;
                  radio.dispatchEvent(new Event('change', { bubbles: true }));
                  this.filledFields++;
                  return true;
                }
              }
            }
          } else {
            // For text inputs, textareas, etc.
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            this.filledFields++;
            return true;
          }
        }
      }
    }
    
    return false;
  },
  
  // Fill personal information fields
  fillPersonalInfo: function() {
    if (!this.userData || !this.userData.personalInfo) return;
    
    const { personalInfo } = this.userData;
    
    // First name
    this.findAndFillField(['firstName', 'first-name', 'first_name', 'fname', 'givenname', 'given-name'], 
                         personalInfo.firstName);
    
    // Last name
    this.findAndFillField(['lastName', 'last-name', 'last_name', 'lname', 'surname', 'family-name', 'familyname'],
                         personalInfo.lastName);
    
    // Full name (combination)
    if (personalInfo.firstName && personalInfo.lastName) {
      this.findAndFillField(['fullname', 'full-name', 'full_name', 'name'], 
                           `${personalInfo.firstName} ${personalInfo.lastName}`);
    }
    
    // Email
    this.findAndFillField(['email', 'e-mail', 'emailaddress', 'email-address'], 
                         personalInfo.email);
    
    // Confirm email
    this.findAndFillField(['confirmEmail', 'confirm-email', 'email-confirm', 'email_confirm', 'verifyemail'],
                         personalInfo.confirmEmail || personalInfo.email);
    
    // City
    this.findAndFillField(['city', 'town', 'locality'], 
                         personalInfo.city);
    
    // Phone number
    this.findAndFillField(['phone', 'phoneNumber', 'phone-number', 'telephone', 'mobile', 'cell', 'cellphone'],
                         personalInfo.phone);
    
    // Cover letter or message to hiring team
    this.findAndFillField(['coverletter', 'cover-letter', 'cover_letter', 'message', 'comments', 'additional-info', 'note', 'notes'],
                         personalInfo.messageToHiringTeam);
  },
  
  // Fill experience information
  fillExperience: function() {
    if (!this.userData || !this.userData.experiences || this.userData.experiences.length === 0) {
      return;
    }
    
    const { experiences } = this.userData;
    
    // Detect if there are multiple experience sections (like in multi-step forms)
    const experienceSections = this.findExperienceSections();
    
    if (experienceSections.length > 0) {
      // If we found specific experience sections, fill them individually
      experienceSections.forEach((section, index) => {
        if (index < experiences.length) {
          this.fillExperienceSection(section, experiences[index]);
        }
      });
    } else {
      // If no specific sections found, try to fill the most recent experience
      // in any fields found on the page
      this.fillExperienceSection(document, experiences[0]);
      
      // Look for "Add Another Experience" buttons to add more experiences
      const addButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
        const text = el.textContent.toLowerCase();
        return (text.includes('add') || text.includes('+')) && 
               (text.includes('experience') || text.includes('employment') || text.includes('work'));
      });
      
      // Click the first add button found for each additional experience
      for (let i = 1; i < experiences.length && i - 1 < addButtons.length; i++) {
        try {
          addButtons[i - 1].click();
          
          // Wait for new fields to appear (simplified approach)
          setTimeout(() => {
            // Find the newly added section (usually the last one)
            const newSections = this.findExperienceSections();
            if (newSections.length >= i) {
              this.fillExperienceSection(newSections[newSections.length - 1], experiences[i]);
            }
          }, 500);
        } catch (error) {
          console.error('Error adding additional experience:', error);
        }
      }
    }
  },
  
  // Find all experience sections in the form
  findExperienceSections: function() {
    // Look for containers that might hold experience fields
    const possibleSections = Array.from(document.querySelectorAll('div, section, fieldset')).filter(container => {
      const containerText = container.textContent.toLowerCase();
      return (containerText.includes('experience') || 
              containerText.includes('employment') || 
              containerText.includes('work history')) &&
              // Make sure it contains form elements
              (container.querySelectorAll('input, select, textarea').length > 0);
    });
    
    return possibleSections;
  },
  
  // Fill a single experience section with data
  fillExperienceSection: function(container, experience) {
    // Job title
    this.findAndFillFieldInContainer(container, 
      ['jobTitle', 'job-title', 'title', 'position', 'role'], 
      experience.title);
    
    // Company name
    this.findAndFillFieldInContainer(container, 
      ['company', 'employer', 'organization', 'workplace', 'firm'], 
      experience.company);
    
    // Location
    this.findAndFillFieldInContainer(container, 
      ['location', 'city', 'workLocation', 'job-location', 'office-location'], 
      experience.location);
    
    // Description/responsibilities
    this.findAndFillFieldInContainer(container, 
      ['description', 'responsibilities', 'duties', 'achievements', 'jobDescription'], 
      experience.description);
    
    // Start date
    if (experience.fromDate) {
      const fromDate = new Date(experience.fromDate);
      
      // Try different date formats (month/year, full date, etc.)
      this.findAndFillFieldInContainer(container, 
        ['startDate', 'start-date', 'from', 'fromDate', 'dateFrom'], 
        experience.fromDate);
      
      // Also try individual month/year fields
      this.findAndFillFieldInContainer(container, 
        ['startMonth', 'start-month', 'fromMonth'], 
        (fromDate.getMonth() + 1).toString().padStart(2, '0'));
      
      this.findAndFillFieldInContainer(container, 
        ['startYear', 'start-year', 'fromYear'], 
        fromDate.getFullYear().toString());
    }
    
    // End date
    if (!experience.current && experience.toDate) {
      const toDate = new Date(experience.toDate);
      
      this.findAndFillFieldInContainer(container, 
        ['endDate', 'end-date', 'to', 'toDate', 'dateTo'], 
        experience.toDate);
      
      // Also try individual month/year fields
      this.findAndFillFieldInContainer(container, 
        ['endMonth', 'end-month', 'toMonth'], 
        (toDate.getMonth() + 1).toString().padStart(2, '0'));
      
      this.findAndFillFieldInContainer(container, 
        ['endYear', 'end-year', 'toYear'], 
        toDate.getFullYear().toString());
    }
    
    // Current position checkbox
    this.findAndFillFieldInContainer(container, 
      ['current', 'currentPosition', 'present', 'currentJob', 'stillWorking', 'currently-working'], 
      experience.current);
  },
  
  // Fill education information
  fillEducation: function() {
    if (!this.userData || !this.userData.educations || this.userData.educations.length === 0) {
      return;
    }
    
    const { educations } = this.userData;
    
    // Detect if there are multiple education sections
    const educationSections = this.findEducationSections();
    
    if (educationSections.length > 0) {
      // If we found specific education sections, fill them individually
      educationSections.forEach((section, index) => {
        if (index < educations.length) {
          this.fillEducationSection(section, educations[index]);
        }
      });
    } else {
      // If no specific sections found, try to fill the most recent education
      // in any fields found on the page
      this.fillEducationSection(document, educations[0]);
      
      // Look for "Add Another Education" buttons
      const addButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
        const text = el.textContent.toLowerCase();
        return (text.includes('add') || text.includes('+')) && 
               (text.includes('education') || text.includes('school') || text.includes('degree'));
      });
      
      // Click the first add button found for each additional education
      for (let i = 1; i < educations.length && i - 1 < addButtons.length; i++) {
        try {
          addButtons[i - 1].click();
          
          // Wait for new fields to appear (simplified approach)
          setTimeout(() => {
            // Find the newly added section (usually the last one)
            const newSections = this.findEducationSections();
            if (newSections.length >= i) {
              this.fillEducationSection(newSections[newSections.length - 1], educations[i]);
            }
          }, 500);
        } catch (error) {
          console.error('Error adding additional education:', error);
        }
      }
    }
  },
  
  // Find all education sections in the form
  findEducationSections: function() {
    // Look for containers that might hold education fields
    const possibleSections = Array.from(document.querySelectorAll('div, section, fieldset')).filter(container => {
      const containerText = container.textContent.toLowerCase();
      return (containerText.includes('education') || 
              containerText.includes('academic') || 
              containerText.includes('school') ||
              containerText.includes('university') ||
              containerText.includes('college')) &&
              // Make sure it contains form elements
              (container.querySelectorAll('input, select, textarea').length > 0);
    });
    
    return possibleSections;
  },
  
  // Fill a single education section with data
  fillEducationSection: function(container, education) {
    // Institution name
    this.findAndFillFieldInContainer(container, 
      ['school', 'institution', 'university', 'college', 'institute', 'schoolName'], 
      education.institution);
    
    // Major/Field of study
    this.findAndFillFieldInContainer(container, 
      ['major', 'field', 'fieldOfStudy', 'course', 'studyField', 'specialization'], 
      education.major);
    
    // Degree
    this.findAndFillFieldInContainer(container, 
      ['degree', 'qualification', 'certification', 'diploma', 'degreeType'], 
      education.degree);
    
    // Location
    this.findAndFillFieldInContainer(container, 
      ['location', 'city', 'campus', 'schoolLocation'], 
      education.location);
    
    // Description
    this.findAndFillFieldInContainer(container, 
      ['description', 'activities', 'achievements', 'projects', 'educationDescription'], 
      education.description);
    
    // Start date
    if (education.fromDate) {
      const fromDate = new Date(education.fromDate);
      
      this.findAndFillFieldInContainer(container, 
        ['startDate', 'start-date', 'from', 'fromDate', 'dateFrom', 'enrollmentDate'], 
        education.fromDate);
      
      // Also try individual month/year fields
      this.findAndFillFieldInContainer(container, 
        ['startMonth', 'start-month', 'fromMonth'], 
        (fromDate.getMonth() + 1).toString().padStart(2, '0'));
      
      this.findAndFillFieldInContainer(container, 
        ['startYear', 'start-year', 'fromYear'], 
        fromDate.getFullYear().toString());
    }
    
    // End date
    if (!education.current && education.toDate) {
      const toDate = new Date(education.toDate);
      
      this.findAndFillFieldInContainer(container, 
        ['endDate', 'end-date', 'to', 'toDate', 'dateTo', 'graduationDate'], 
        education.toDate);
      
      // Also try individual month/year fields
      this.findAndFillFieldInContainer(container, 
        ['endMonth', 'end-month', 'toMonth', 'graduationMonth'], 
        (toDate.getMonth() + 1).toString().padStart(2, '0'));
      
      this.findAndFillFieldInContainer(container, 
        ['endYear', 'end-year', 'toYear', 'graduationYear'], 
        toDate.getFullYear().toString());
    }
    
    // Current education checkbox
    this.findAndFillFieldInContainer(container, 
      ['current', 'currentStudent', 'attending', 'enrolled', 'currentlyEnrolled', 'inProgress'], 
      education.current);
  },
  
  // Fill social profiles information
  fillSocialProfiles: function() {
    if (!this.userData || !this.userData.socialProfiles) return;
    
    const { socialProfiles } = this.userData;
    
    // LinkedIn
    this.findAndFillField(['linkedin', 'linkedInUrl', 'linkedinurl', 'linkedin-url', 'linkedin_url'], 
                         socialProfiles.linkedin);
    
    // Facebook
    this.findAndFillField(['facebook', 'facebookUrl', 'facebookurl', 'facebook-url', 'facebook_url'], 
                         socialProfiles.facebook);
    
    // Twitter (X)
    this.findAndFillField(['twitter', 'twitterUrl', 'twitterurl', 'twitter-url', 'twitter_url', 'x', 'x-url'], 
                         socialProfiles.twitter);
    
    // Personal website
    this.findAndFillField(['website', 'webpage', 'personalSite', 'personal-site', 'site', 'portfolio'], 
                         socialProfiles.website);
    
    // General social media fields
    const allSocials = [
      { url: socialProfiles.linkedin, type: 'linkedin' },
      { url: socialProfiles.twitter, type: 'twitter' },
      { url: socialProfiles.facebook, type: 'facebook' },
      { url: socialProfiles.website, type: 'website' }
    ].filter(social => social.url);
    
    // Find generic "social media" fields
    const genericSocialFields = Array.from(document.querySelectorAll('input[type="url"], input[type="text"]')).filter(input => {
      const inputContainer = input.closest('div, form, section');
      const containerText = inputContainer ? inputContainer.textContent.toLowerCase() : '';
      
      return containerText.includes('social') || 
             containerText.includes('profile') ||
             containerText.includes('media') ||
             containerText.includes('url') ||
             containerText.includes('link');
    });
    
    // Try to match generic social fields with our data
    genericSocialFields.forEach(field => {
      const fieldLabel = this.getFieldLabel(field);
      if (fieldLabel) {
        const labelText = fieldLabel.toLowerCase();
        
        // Find the right social to fill based on label text
        for (const social of allSocials) {
          if (labelText.includes(social.type) && !field.value) {
            field.value = social.url;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            this.filledFields++;
            break;
          }
        }
      }
    });
  },
  
  // Upload resume file
  uploadResume: function() {
    if (!this.userData || !this.userData.resume) return;
    
    const resume = this.userData.resume;
    
    // Find file inputs that might be for resume upload
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).filter(input => {
      // Check if the input or its container has resume-related keywords
      const inputContainer = input.closest('div, form, section');
      const containerText = inputContainer ? inputContainer.textContent.toLowerCase() : '';
      
      return input.accept.includes('pdf') || 
             input.accept.includes('doc') || 
             containerText.includes('resume') || 
             containerText.includes('cv') ||
             containerText.includes('upload') ||
             containerText.includes('document');
    });
    
    if (fileInputs.length > 0) {
      // Create a File object from the stored resume data
      // Note: This is a simplified approach and may not work on all websites
      // due to security restrictions in browsers
      try {
        const dataString = resume.data;
        const dataType = resume.type;
        
        // Convert data URL to blob
        const byteString = atob(dataString.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: dataType });
        const file = new File([blob], resume.name, { type: dataType });
        
        // Create a DataTransfer object to create a FileList
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Set the file input value
        fileInputs.forEach(input => {
          // Only proceed if the input accepts this file type
          if (input.accept.includes(dataType.split('/')[1]) || input.accept === '') {
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            this.filledFields++;
          }
        });
      } catch (error) {
        console.error('Error uploading resume:', error);
      }
    }
  },
  
  // Helper function to find and fill a field within a specific container
  findAndFillFieldInContainer: function(container, selectors, value) {
    if (!value) return false;
    
    // Try each selector in the array
    for (const selector of selectors) {
      // Try various attribute selectors within the container
      const possibleElements = [
        // By ID
        ...container.querySelectorAll(`#${selector}, [id*="${selector}"]`),
        // By name
        ...container.querySelectorAll(`[name="${selector}"], [name*="${selector}"]`),
        // By placeholder
        ...container.querySelectorAll(`[placeholder*="${selector}" i]`),
        // By label
        ...Array.from(container.querySelectorAll('label')).filter(label => 
          label.textContent.toLowerCase().includes(selector.toLowerCase())
        ).map(label => {
          // Get associated input via for attribute
          if (label.htmlFor) {
            return document.getElementById(label.htmlFor);
          }
          // Get input within the label
          return label.querySelector('input, textarea, select');
        }).filter(el => el)
      ];
      
      for (const element of possibleElements) {
        if (element && !element.disabled && !element.readOnly) {
          // Fill the element
          if (element.tagName === 'SELECT') {
            // For dropdown/select elements
            for (let i = 0; i < element.options.length; i++) {
              if (element.options[i].text.toLowerCase().includes(value.toString().toLowerCase())) {
                element.selectedIndex = i;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                this.filledFields++;
                return true;
              }
            }
          } else if (element.type === 'checkbox') {
            element.checked = !!value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            this.filledFields++;
            return true;
          } else if (element.type === 'radio') {
            // For radio buttons
            const name = element.name;
            if (name) {
              const radios = container.querySelectorAll(`input[name="${name}"]`);
              for (const radio of radios) {
                if (radio.value.toLowerCase() === value.toString().toLowerCase() || 
                    radio.nextSibling?.textContent?.toLowerCase().includes(value.toString().toLowerCase())) {
                  radio.checked = true;
                  radio.dispatchEvent(new Event('change', { bubbles: true }));
                  this.filledFields++;
                  return true;
                }
              }
            }
          } else {
            // For text inputs, textareas, etc.
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            this.filledFields++;
            return true;
          }
        }
      }
    }
    
    return false;
  },
  
  // Helper function to get a field's label
  getFieldLabel: function(field) {
    // Try to find a label that references this field by its ID
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) {
        return label.textContent.trim();
      }
    }
    
    // Try to find a parent label
    const parentLabel = field.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.trim().replace(field.value, '').trim();
    }
    
    // Try to find a label-like element nearby
    const parentDiv = field.parentElement;
    if (parentDiv) {
      // Check for preceding siblings that might be labels
      let sibling = parentDiv.previousElementSibling;
      if (sibling && (sibling.tagName === 'LABEL' || sibling.tagName === 'DIV' || sibling.tagName === 'SPAN')) {
        return sibling.textContent.trim();
      }
      
      // Check for preceding elements within the same parent
      sibling = field.previousElementSibling;
      if (sibling && (sibling.tagName === 'LABEL' || sibling.tagName === 'DIV' || sibling.tagName === 'SPAN')) {
        return sibling.textContent.trim();
      }
    }
    
    return null;
  }
};

// Initialize FormFiller when the page loads
FormFiller.init();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.action) return;
  
  let result;
  
  // Execute the appropriate action based on the message
  switch (message.action) {
    case 'fillAll':
      result = FormFiller.fillAll();
      break;
    case 'fillPersonal':
      FormFiller.resetCounter();
      FormFiller.fillPersonalInfo();
      result = { success: true, filledCount: FormFiller.filledFields };
      break;
    case 'fillExperience':
      FormFiller.resetCounter();
      FormFiller.fillExperience();
      result = { success: true, filledCount: FormFiller.filledFields };
      break;
    case 'fillEducation':
      FormFiller.resetCounter();
      FormFiller.fillEducation();
      result = { success: true, filledCount: FormFiller.filledFields };
      break;
    case 'fillSocial':
      FormFiller.resetCounter();
      FormFiller.fillSocialProfiles();
      result = { success: true, filledCount: FormFiller.filledFields };
      break;
    default:
      result = { success: false, message: 'Unknown action' };
  }
  
  sendResponse(result);
  return true; // Keep the message channel open for async response
}); 