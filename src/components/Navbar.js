// Navbar.js
import { storage } from '../utils/storage.js';

export function renderNavbar(appState, onNavigate, onLanguageToggle) {
  const trans = appState.translations;
  const isRTL = appState.lang === 'ar';
  
  // Custom SVG icon for Spark Logo
  const logoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  `;

  const dashboardBtn = appState.currentView === 'editor' 
    ? `<button class="btn btn-secondary btn-sm" id="nav-back-dash">
         ${trans.dashboard}
       </button>`
    : '';

  const html = `
    <nav class="navbar">
      <div class="nav-brand" id="nav-brand-logo">
        ${logoSvg}
        <span>${trans.appName}</span>
        <span class="badge badge-primary btn-sm" style="font-size: 0.65rem; padding: 2px 8px;">BETA</span>
      </div>
      
      <div class="nav-links">
        ${dashboardBtn}
        <button class="btn btn-secondary btn-sm" id="nav-lang-toggle" style="font-family: ${appState.lang === 'ar' ? 'var(--font-english)' : 'var(--font-arabic)'}">
          🌐 ${trans.langToggle}
        </button>
      </div>
    </nav>
  `;

  // Attach event handlers after mounting
  setTimeout(() => {
    const brand = document.getElementById('nav-brand-logo');
    if (brand) {
      brand.addEventListener('click', () => {
        onNavigate('dashboard');
      });
    }

    const backBtn = document.getElementById('nav-back-dash');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        onNavigate('dashboard');
      });
    }

    const langBtn = document.getElementById('nav-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        onLanguageToggle();
      });
    }
  }, 0);

  return html;
}
