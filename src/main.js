// main.js
import { storage } from './utils/storage.js';
import { renderNavbar } from './components/Navbar.js';
import { openAIDialog } from './components/AIDialog.js';
import { renderTemplateGallery } from './components/TemplateGallery.js';
import { renderProjectCard, bindProjectCardEvents } from './components/ProjectCard.js';
import { renderVisualEditor } from './components/VisualEditor.js';

import arTrans from './i18n/ar.js';
import enTrans from './i18n/en.js';

// Global Application State Model
const appState = {
  lang: storage.getLang(),
  translations: storage.getLang() === 'ar' ? arTrans : enTrans,
  currentView: 'dashboard', // dashboard | editor | site-preview
  activeProject: null,
  activeDashboardTab: 'my-projects' // my-projects | community | templates
};

// Toggle Language Handler
function toggleLanguage() {
  const nextLang = appState.lang === 'ar' ? 'en' : 'ar';
  appState.lang = nextLang;
  appState.translations = nextLang === 'ar' ? arTrans : enTrans;
  storage.setLang(nextLang);
  
  // Update HTML tag attributes
  document.documentElement.lang = nextLang;
  document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  
  // Re-route/Re-render current state
  router();
}

// Router to handle SPA paths
function router() {
  const hash = window.location.hash;
  
  // Apply visual theme base adjustments
  document.documentElement.setAttribute('data-theme', 'dark');

  if (hash.startsWith('#editor/')) {
    const projId = hash.replace('#editor/', '');
    const proj = storage.getProjectById(projId);
    if (proj) {
      appState.currentView = 'editor';
      appState.activeProject = proj;
      renderWorkspace();
    } else {
      window.location.hash = '#dashboard';
    }
  } else if (hash.startsWith('#site/')) {
    const projId = hash.replace('#site/', '');
    const proj = storage.getProjectById(projId);
    if (proj) {
      appState.currentView = 'site-preview';
      appState.activeProject = proj;
      renderDeployedSite(proj);
    } else {
      window.location.hash = '#dashboard';
    }
  } else {
    // Default to dashboard
    appState.currentView = 'dashboard';
    appState.activeProject = null;
    renderWorkspace();
  }
}

// Navigation Helper
function navigateTo(view, projectId = null) {
  if (view === 'editor' && projectId) {
    window.location.hash = `#editor/${projectId}`;
  } else if (view === 'site' && projectId) {
    window.location.hash = `#site/${projectId}`;
  } else {
    window.location.hash = '#dashboard';
  }
}

// Mount Workspace layout
function renderWorkspace() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  
  // Clear any existing class overrides
  appContainer.className = '';

  if (appState.currentView === 'editor') {
    // Render editor directly, takes up full viewport
    appContainer.innerHTML = renderVisualEditor(appState, appState.activeProject, () => {
      navigateTo('dashboard');
    });
  } else {
    // Render Standard Dashboard Layout with Navbar
    appContainer.innerHTML = `
      ${renderNavbar(appState, (view) => navigateTo(view), toggleLanguage)}
      <main class="main-container">
        
        <!-- Hero Generative Prompt Section -->
        <section class="hero-section">
          <span class="hero-tagline">${appState.translations.appTagline}</span>
          <h1 class="hero-title text-gradient-rainbow">${appState.translations.heroTitle}</h1>
          <p class="hero-subtitle">${appState.translations.heroSubtitle}</p>
          
          <!-- Large Prompt Input -->
          <div class="ai-prompter-container">
            <input type="text" class="ai-prompt-input" id="dashboard-prompt-input" placeholder="${appState.translations.promptPlaceholder}" />
            <button class="btn btn-primary btn-lg" id="dashboard-prompt-submit">
              ✨ ${appState.translations.create}
            </button>
          </div>

          <!-- Auto prompt tags suggestions -->
          <div style="margin-top: 10px;">
            <p style="font-size: 0.9rem; color: var(--text-muted);">${appState.translations.suggestTitle}</p>
            <div class="prompt-suggestions">
              <span class="suggestion-tag" data-prompt="${appState.translations.suggest1}">${appState.translations.suggest1}</span>
              <span class="suggestion-tag" data-prompt="${appState.translations.suggest2}">${appState.translations.suggest2}</span>
              <span class="suggestion-tag" data-prompt="${appState.translations.suggest3}">${appState.translations.suggest3}</span>
              <span class="suggestion-tag" data-prompt="${appState.translations.suggest4}">${appState.translations.suggest4}</span>
            </div>
          </div>
        </section>

        <!-- Tab Controls Navigation -->
        <div class="dashboard-tabs">
          <button class="tab-btn ${appState.activeDashboardTab === 'my-projects' ? 'active' : ''}" id="tab-my-projects">
            📂 ${appState.translations.myProjects}
          </button>
          <button class="tab-btn ${appState.activeDashboardTab === 'community' ? 'active' : ''}" id="tab-community">
            🔓 ${appState.translations.communityProjects}
          </button>
          <button class="tab-btn ${appState.activeDashboardTab === 'templates' ? 'active' : ''}" id="tab-templates">
            🎨 ${appState.translations.websiteTemplates}
          </button>
        </div>

        <!-- Dynamic Grid Content Area -->
        <div id="dashboard-grid-area">
          <!-- Populated by JS -->
        </div>

      </main>
    `;

    // Bind Dashboard-specific interactive events
    setTimeout(() => {
      // Prompt triggers
      const pInput = document.getElementById('dashboard-prompt-input');
      const pSubmit = document.getElementById('dashboard-prompt-submit');
      
      const handlePromptCreate = () => {
        const text = pInput.value.trim();
        if (text) {
          openAIDialog(appState, text, (newProj) => {
            navigateTo('editor', newProj.id);
          });
        } else {
          alert(appState.lang === 'ar' ? 'يرجى كتابة فكرة موقعك أولاً!' : 'Please describe your website idea first!');
        }
      };

      pSubmit.addEventListener('click', handlePromptCreate);
      pInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handlePromptCreate();
      });

      // Suggestions clicks
      document.querySelectorAll('.suggestion-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          const txt = tag.getAttribute('data-prompt');
          pInput.value = txt;
          // Open AI Dialog instantly
          openAIDialog(appState, txt, (newProj) => {
            navigateTo('editor', newProj.id);
          });
        });
      });

      // Tabs click
      document.getElementById('tab-my-projects').addEventListener('click', () => {
        switchDashboardTab('my-projects');
      });
      document.getElementById('tab-community').addEventListener('click', () => {
        switchDashboardTab('community');
      });
      document.getElementById('tab-templates').addEventListener('click', () => {
        switchDashboardTab('templates');
      });

      // Initial tab load rendering
      switchDashboardTab(appState.activeDashboardTab);

    }, 0);
  }
}

// Switching tabs contents
function switchDashboardTab(tabName) {
  appState.activeDashboardTab = tabName;
  
  // Highlight tab button
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  const container = document.getElementById('dashboard-grid-area');
  if (!container) return;

  if (tabName === 'my-projects') {
    const list = storage.getProjects().filter(p => !p.isSystem); // Filter user-owned projects
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h4 style="font-weight:700;">${appState.translations.noProjectsYet}</h4>
        </div>
      `;
      return;
    }
    
    let gridHtml = `<div class="projects-grid">`;
    list.forEach(proj => {
      gridHtml += renderProjectCard(appState, proj, false);
    });
    gridHtml += `</div>`;
    container.innerHTML = gridHtml;

    // Attach card event triggers (Edit, clone, delete)
    bindProjectCardEvents(
      appState,
      (id) => navigateTo('editor', id),
      (cloned) => switchDashboardTab('my-projects'),
      () => switchDashboardTab('my-projects'),
      (id) => window.open(`${window.location.origin}${window.location.pathname}#site/${id}`, '_blank')
    );

  } else if (tabName === 'community') {
    const list = storage.getPublicProjects();
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔓</div>
          <h4>No public projects shared by the community yet.</h4>
        </div>
      `;
      return;
    }

    let gridHtml = `<div class="projects-grid">`;
    list.forEach(proj => {
      gridHtml += renderProjectCard(appState, proj, true);
    });
    gridHtml += `</div>`;
    container.innerHTML = gridHtml;

    // Attach community clone triggers
    bindProjectCardEvents(
      appState,
      null,
      (cloned) => navigateTo('editor', cloned.id), // Go to editor on cloning public site!
      null,
      (id) => window.open(`${window.location.origin}${window.location.pathname}#site/${id}`, '_blank')
    );

  } else if (tabName === 'templates') {
    // Render templates
    container.innerHTML = renderTemplateGallery(appState, (newProj) => {
      navigateTo('editor', newProj.id);
    });
  }
}

// --- Deployed Site Standalone Render Engine ---
function renderDeployedSite(project) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  const fontClass = project.font || 'font-arabic';
  const siteDir = project.language === 'ar' ? 'rtl' : 'ltr';
  const activeTheme = project.theme || 'theme-corporate';

  // Back button widget for users to return to platform dashboard easily (floating corner element)
  const platformBackWidget = `
    <div style="position: fixed; top: 16px; right: 16px; z-index: 10000; display: flex; gap: 8px;">
      <a href="#dashboard" style="background: rgba(10, 14, 26, 0.85); color: #fff; padding: 8px 16px; border-radius: 99px; font-weight: 600; font-size: 0.85rem; text-decoration: none; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        ⚡ Back to Cabable
      </a>
    </div>
  `;

  // Start rendering layout sections
  let siteHtml = `
    ${platformBackWidget}
    <div class="web-preview ${activeTheme} ${fontClass}" dir="${siteDir}" lang="${project.language}" style="min-height: 100vh;">
  `;

  project.sections.forEach((sec) => {
    if (sec.type === 'hero') {
      siteHtml += `
        <header class="web-section web-hero" id="${sec.id}">
          <div class="web-container">
            <h1 class="web-hero-title">${sec.content.title}</h1>
            <p class="web-hero-desc">${sec.content.subtitle}</p>
            <div>
              <a href="${sec.content.ctaLink || '#contact'}" class="web-btn">
                ${sec.content.ctaText}
              </a>
            </div>
          </div>
        </header>
      `;
    } else if (sec.type === 'features') {
      let cardsHtml = '';
      (sec.content.items || []).forEach(item => {
        cardsHtml += `
          <div class="web-card">
            <div class="web-card-icon">${item.icon}</div>
            <h3 class="web-card-title">${item.title}</h3>
            <p class="web-card-desc">${item.desc}</p>
          </div>
        `;
      });

      siteHtml += `
        <section class="web-section" id="${sec.id}">
          <div class="web-container">
            <h2 class="web-section-title">${sec.content.title}</h2>
            <p class="web-section-subtitle">${sec.content.subtitle}</p>
            <div class="web-grid-3">
              ${cardsHtml}
            </div>
          </div>
        </section>
      `;
    } else if (sec.type === 'gallery') {
      let itemsHtml = '';
      (sec.content.items || []).forEach(item => {
        itemsHtml += `
          <div class="web-gallery-item">
            <img src="${item.url || ''}" alt="" />
            <div class="web-gallery-caption">${item.caption}</div>
          </div>
        `;
      });

      siteHtml += `
        <section class="web-section" id="${sec.id}">
          <div class="web-container">
            <h2 class="web-section-title">${sec.content.title}</h2>
            <p class="web-section-subtitle">${sec.content.subtitle}</p>
            <div class="web-gallery-grid">
              ${itemsHtml}
            </div>
          </div>
        </section>
      `;
    } else if (sec.type === 'contact') {
      let inputsHtml = '';
      (sec.content.fields || []).forEach(f => {
        if (f === 'notes') {
          inputsHtml += `<textarea class="web-textarea" id="form-field-notes" placeholder="${project.language === 'ar' ? 'رسالتك وملاحظاتك...' : 'Your notes/message...'}" required></textarea>`;
        } else {
          let label = f.toUpperCase();
          let id = `form-field-${f}`;
          let req = 'required';
          if (f === 'name') label = project.language === 'ar' ? 'الاسم الكامل' : 'Full Name';
          if (f === 'phone') label = project.language === 'ar' ? 'رقم الهاتف' : 'Phone Number';
          if (f === 'email') label = project.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address';
          if (f === 'date') label = project.language === 'ar' ? 'التاريخ والوقت المطلوبان' : 'Booking Date/Time';
          
          inputsHtml += `<input type="text" class="web-input" id="${id}" placeholder="${label}" ${req} />`;
        }
      });

      siteHtml += `
        <section class="web-section" id="${sec.id}">
          <div class="web-container">
            <h2 class="web-section-title">${sec.content.title}</h2>
            <p class="web-section-subtitle">${sec.content.subtitle}</p>
            
            <form class="web-contact-form" id="live-contact-form">
              <div class="web-contact-success" id="live-contact-success">
                ${project.language === 'ar' ? 'شكراً لك! تم إرسال رسالتك وتأكيد الحجز بنجاح.' : 'Thank you! Your submission was recorded successfully.'}
              </div>
              ${inputsHtml}
              <button type="submit" class="web-btn" id="live-form-submit-btn" style="width: 100%; justify-content: center; font-size: 1.05rem;">
                ${project.language === 'ar' ? 'حفظ وإرسال الطلب' : 'Submit Details'}
              </button>
            </form>
          </div>
        </section>
      `;
    } else if (sec.type === 'footer') {
      siteHtml += `
        <footer class="web-footer" id="${sec.id}">
          <div class="web-footer-container">
            <p>${sec.content.text}</p>
            <p style="font-size: 0.8rem; opacity: 0.8;">${sec.content.links}</p>
          </div>
        </footer>
      `;
    }
  });

  siteHtml += `
      <!-- Tiny Brand Tag -->
      <div style="background: var(--web-bg-1); text-align: center; font-size: 0.75rem; padding: 20px 0; border-top: 1px dashed var(--web-border); opacity: 0.75;">
        ⚡ Built instantly with <a href="#dashboard" style="color: var(--web-primary); font-weight: 700;">Cabable Platform</a>
      </div>
    </div>
  `;
  
  appContainer.innerHTML = siteHtml;

  // Bind Submit handler to perform ACTUAL WEBHOOK fetch post
  setTimeout(() => {
    const contactForm = document.getElementById('live-contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('live-form-submit-btn');
        const successBox = document.getElementById('live-contact-success');
        
        submitBtn.disabled = true;
        submitBtn.innerText = project.language === 'ar' ? 'جاري الإرسال...' : 'Submitting...';

        // Gather Form Data
        const formData = {};
        (project.sections.find(s => s.type === 'contact')?.content.fields || []).forEach(f => {
          const el = document.getElementById(`form-field-${f}`);
          if (el) formData[f] = el.value;
        });

        const webhookUrl = project.deployed?.webhookUrl || '';
        
        if (webhookUrl) {
          // If webhook is defined, post the real data!
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              formSubmission: true,
              project: { id: project.id, name: project.name },
              timestamp: new Date().toISOString(),
              payload: formData
            }),
            mode: 'no-cors' // Use no-cors in case target doesn't return CORS headers to browser
          })
          .then(() => {
            showSuccess();
          })
          .catch((err) => {
            console.error("Form webhook submission error: ", err);
            // Treat as successful since no-cors might hide response, but display warning in console
            showSuccess();
          });
        } else {
          // Simulated success
          setTimeout(() => {
            showSuccess();
          }, 800);
        }

        function showSuccess() {
          successBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.innerText = project.language === 'ar' ? 'تم الإرسال ✓' : 'Submitted ✓';
          contactForm.reset();
        }
      });
    }
  }, 0);
}

// Router Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// Real-Time Cross-Tab Sync
window.addEventListener('storage', (e) => {
  if (e.key === 'cabable_projects' && appState.currentView === 'site-preview' && appState.activeProject) {
    const updatedProj = storage.getProjectById(appState.activeProject.id);
    if (updatedProj) {
      appState.activeProject = updatedProj;
      renderDeployedSite(updatedProj);
    }
  }
});
