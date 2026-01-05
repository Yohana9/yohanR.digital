/**
 * Yohannes Reta Portfolio - Enhanced Main JavaScript
 * Professional, production-safe, and performant
 */

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  initThemeToggle();
  initNavigation();
  initSmoothScroll();
  initFormValidation();
  initCertificateModal();
  initScrollAnimations();
  initSkillBars();
  initTooltips();
  initFloatingShapes();
  
  // Set current year in footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Performance optimization
  optimizeImages();
  debounceResize();
});

// ===== THEME MANAGEMENT =====
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('portfolio-theme') || 'light';
  body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Update theme
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Add transition class
    body.classList.add('theme-transitioning');
    setTimeout(() => {
      body.classList.remove('theme-transitioning');
    }, 300);
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  });
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  const icon = themeToggle.querySelector('i');
  
  if (theme === 'dark') {
    icon.className = 'bx bx-sun';
    themeToggle.setAttribute('data-tooltip', 'Light Mode');
  } else {
    icon.className = 'bx bx-moon';
    themeToggle.setAttribute('data-tooltip', 'Dark Mode');
  }
}

// ===== NAVIGATION SYSTEM =====
function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const sidebar = document.querySelector('.sidebar');
  const navOverlay = document.querySelector('.nav-overlay');
  const navItems = document.querySelectorAll('.nav-item');
  
  // Mobile nav toggle
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    
    navToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
    navOverlay.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', !isExpanded);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isExpanded ? '' : 'hidden';
  });
  
  // Close menu when clicking overlay
  navOverlay.addEventListener('click', () => {
    navToggle.classList.remove('active');
    sidebar.classList.remove('active');
    navOverlay.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
  
  // Close menu when clicking nav items (mobile)
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        navToggle.classList.remove('active');
        sidebar.classList.remove('active');
        navOverlay.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });
  
  // Update active nav item on scroll
  window.addEventListener('scroll', debounce(() => {
    updateActiveNavItem();
  }, 100));
}

function updateActiveNavItem() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-item');
  const scrollPosition = window.scrollY + 100;
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    const sectionId = section.getAttribute('id');
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${sectionId}`) {
          item.classList.add('active');
        }
      });
    }
  });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
      
      // Calculate offset based on viewport
      const offset = 80;
      const targetPosition = targetElement.offsetTop - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      // Update URL without page jump
      history.pushState(null, null, targetId);
    });
  });
}

// ===== FORM VALIDATION & SUBMISSION =====
function initFormValidation() {
  const contactForm = document.getElementById('contactForm');
  
  if (!contactForm) return;
  
  const formFields = {
    name: {
      element: contactForm.querySelector('#name'),
      validator: validateName
    },
    email: {
      element: contactForm.querySelector('#email'),
      validator: validateEmail
    },
    subject: {
      element: contactForm.querySelector('#subject'),
      validator: validateSubject
    },
    message: {
      element: contactForm.querySelector('#message'),
      validator: validateMessage
    }
  };
  
  // Real-time validation
  Object.values(formFields).forEach(({ element, validator }) => {
    element.addEventListener('input', () => {
      const errorElement = element.parentElement.querySelector('.form-error');
      const isValid = validator(element.value);
      
      if (isValid) {
        element.classList.remove('error');
        element.classList.add('success');
        errorElement.textContent = '';
      } else {
        element.classList.remove('success');
        element.classList.add('error');
        errorElement.textContent = getErrorMessage(element.id);
      }
    });
    
    element.addEventListener('blur', () => {
      if (!element.value) {
        element.classList.remove('error', 'success');
        const errorElement = element.parentElement.querySelector('.form-error');
        errorElement.textContent = '';
      }
    });
  });
  
  // Form submission
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let isValid = true;
    const formData = new FormData(contactForm);
    
    // Validate all fields
    Object.entries(formFields).forEach(([fieldName, { element, validator }]) => {
      const errorElement = element.parentElement.querySelector('.form-error');
      const value = element.value.trim();
      
      if (!validator(value)) {
        element.classList.add('error');
        errorElement.textContent = getErrorMessage(element.id);
        isValid = false;
      } else {
        element.classList.remove('error');
        element.classList.add('success');
        errorElement.textContent = '';
      }
    });
    
    if (!isValid) {
      showFormStatus('Please fix the errors above.', 'error');
      return;
    }
    
    // Submit form via AJAX
    try {
      showFormStatus('Sending message...', 'loading');
      
      // Disable submit button
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      
      // Simulate API call (replace with actual fetch to sendEmail.php)
      await simulateSubmit(formData);
      
      // Success
      showFormStatus('Message sent successfully!', 'success');
      contactForm.reset();
      
      // Remove success classes
      Object.values(formFields).forEach(({ element }) => {
        element.classList.remove('success');
      });
      
      // Re-enable button after 3 seconds
      setTimeout(() => {
        submitBtn.disabled = false;
        showFormStatus('', '');
      }, 3000);
      
    } catch (error) {
      showFormStatus('Failed to send message. Please try again.', 'error');
      
      // Re-enable button
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
    }
  });
}

function validateName(name) {
  return name.trim().length >= 2;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validateSubject(subject) {
  return subject.trim().length >= 3;
}

function validateMessage(message) {
  return message.trim().length >= 10;
}

function getErrorMessage(fieldId) {
  const messages = {
    name: 'Name must be at least 2 characters',
    email: 'Please enter a valid email address',
    subject: 'Subject must be at least 3 characters',
    message: 'Message must be at least 10 characters'
  };
  return messages[fieldId] || 'Invalid input';
}

function showFormStatus(message, type) {
  const statusElement = document.getElementById('formStatus');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.className = 'form-status';
  
  if (type) {
    statusElement.classList.add(type);
  }
}

async function simulateSubmit(formData) {
  // In production, replace this with actual fetch to sendEmail.php
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate network delay
      Math.random() > 0.1 ? resolve() : reject(new Error('Network error'));
    }, 1500);
  });
}

// ===== CERTIFICATE MODAL =====
function initCertificateModal() {
  const modal = document.getElementById('certificateModal');
  const modalClose = modal.querySelector('.modal-close');
  const modalImage = modal.querySelector('#modalImage');
  const viewButtons = document.querySelectorAll('.certificate-view');
  
  // Open modal
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      const certId = button.getAttribute('data-cert');
      const imgSrc = getCertificateImage(certId);
      
      modalImage.src = imgSrc;
      modalImage.alt = `Certificate - ${certId}`;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  
  // Close modal
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

function getCertificateImage(certId) {
  const images = {
    ccna: 'assets/images/certificates/CCNA1.png',
    cyber: 'assets/images/certificates/cyber.jpg',
    frontend: 'assets/images/certificates/Front_End.jpg',
    kaizen: 'assets/images/certificates/kaizen.jpg',
    saylor: 'assets/images/certificates/saylor.jpg'
  };
  return images[certId] || 'assets/images/certificates/default.jpg';
}

function closeModal() {
  const modal = document.getElementById('certificateModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  // Use AOS for most animations, add custom ones here
  
  // Parallax effect for hero shapes
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach((shape, index) => {
      const speed = 0.1 * (index + 1);
      const yPos = -(scrolled * speed);
      shape.style.transform = `translateY(${yPos}px)`;
    });
  });
  
  // Reveal animations on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements
  document.querySelectorAll('.skill-progress').forEach(el => {
    observer.observe(el);
  });
}

// ===== SKILL BARS ANIMATION =====
function initSkillBars() {
  const skillBars = document.querySelectorAll('.skill-progress');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const width = entry.target.style.width;
        entry.target.style.width = '0%';
        
        setTimeout(() => {
          entry.target.style.transition = 'width 1s ease-in-out';
          entry.target.style.width = width;
        }, 100);
        
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  skillBars.forEach(bar => observer.observe(bar));
}

// ===== TOOLTIPS =====
function initTooltips() {
  const elements = document.querySelectorAll('[data-tooltip]');
  
  elements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      const tooltip = element.getAttribute('data-tooltip');
      if (!tooltip) return;
      
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'custom-tooltip';
      tooltipEl.textContent = tooltip;
      
      document.body.appendChild(tooltipEl);
      
      const rect = element.getBoundingClientRect();
      tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
      tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
      tooltipEl.style.transform = 'translateX(-50%)';
      
      element._tooltip = tooltipEl;
    });
    
    element.addEventListener('mouseleave', () => {
      if (element._tooltip) {
        element._tooltip.remove();
        delete element._tooltip;
      }
    });
  });
}

// ===== FLOATING SHAPES =====
function initFloatingShapes() {
  const shapes = document.querySelectorAll('.shape');
  
  shapes.forEach((shape, index) => {
    // Randomize animation
    const duration = 3 + Math.random() * 2;
    const delay = index * 0.5;
    
    shape.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
  });
}

// ===== PERFORMANCE OPTIMIZATION =====
function optimizeImages() {
  // Lazy load images
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
}

function debounceResize() {
  let resizeTimeout;
  
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Update any layout-dependent calculations
      updateActiveNavItem();
    }, 250);
  });
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
  console.error('Portfolio Error:', e.error);
  // In production, you might want to send this to an error tracking service
});

// ===== EXPORT FOR MODULES (if needed) =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initThemeToggle,
    initNavigation,
    initFormValidation
  };
}


// ===== FORM SUBMISSION (Updated for no database) =====
async function submitContactForm(formData) {
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.innerHTML = '<i class="bx bx-loader bx-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        // Send form data
        const response = await fetch('php/sendEmail.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showFormStatus(result.message, 'success');
            
            // Clear form
            document.getElementById('contactForm').reset();
            
            // Remove validation classes
            document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
                input.classList.remove('success', 'error');
            });
            
            // Clear errors
            document.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
            
        } else {
            showFormStatus(result.message, 'error');
            
            // Show field errors
            if (result.errors) {
                Object.keys(result.errors).forEach(field => {
                    const input = document.getElementById(field);
                    const errorElement = input?.parentElement?.querySelector('.form-error');
                    if (input && errorElement) {
                        input.classList.add('error');
                        errorElement.textContent = result.errors[field];
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showFormStatus('Network error. Please check your connection.', 'error');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Initialize form submission
function initFormSubmission() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm(contactForm)) {
            return;
        }
        
        // Create FormData
        const formData = new FormData(contactForm);
        
        // Add hidden honeypot field
        formData.append('website', ''); // Empty honeypot field
        
        // Submit form
        await submitContactForm(formData);
    });
}