// TemplateGallery.js
import { templates } from '../utils/templates.js';
import { storage } from '../utils/storage.js';

export function renderTemplateGallery(appState, onSelectTemplate) {
  const trans = appState.translations;
  const currentTemplates = templates[appState.lang] || [];
  
  if (currentTemplates.length === 0) {
    return `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>No templates loaded for this language.</p>
    </div>`;
  }

  let html = `<div class="projects-grid">`;

  currentTemplates.forEach((tpl) => {
    // Determine thumbnail icon/pattern based on template category
    let icon = '📁';
    let patternClass = '💻';
    if (tpl.id.includes('resto')) {
      icon = '🍔';
      patternClass = '🍕';
    } else if (tpl.id.includes('portfolio')) {
      icon = '🎨';
      patternClass = '📐';
    } else if (tpl.id.includes('agency')) {
      icon = '📢';
      patternClass = '🚀';
    }

    // Match localized names & descriptions if missing in object
    let name = tpl.name;
    let desc = tpl.description;
    if (tpl.id.includes('resto')) {
      name = trans.tplRestoName;
      desc = trans.tplRestoDesc;
    } else if (tpl.id.includes('portfolio')) {
      name = trans.tplPortfolioName;
      desc = trans.tplPortfolioDesc;
    } else if (tpl.id.includes('agency')) {
      name = trans.tplAgencyName;
      desc = trans.tplAgencyDesc;
    }

    // Map theme label
    let themeBadge = trans.aiColorCorporate;
    if (tpl.theme === 'theme-sunset') themeBadge = trans.aiColorSunset;
    if (tpl.theme === 'theme-emerald') themeBadge = trans.aiColorEmerald;
    if (tpl.theme === 'theme-midnight') themeBadge = trans.aiColorMidnight;

    html += `
      <div class="project-card" data-template-id="${tpl.id}">
        <div class="card-thumbnail">
          <div class="card-thumbnail-pattern">${patternClass}</div>
          <div class="thumbnail-overlay">
            <button class="btn btn-primary btn-sm use-template-btn" data-tpl-id="${tpl.id}">
              ✨ ${trans.create}
            </button>
          </div>
        </div>
        
        <div class="card-body">
          <div class="card-header-row">
            <h4 class="card-title">${name}</h4>
            <span class="badge badge-secondary">${themeBadge}</span>
          </div>
          <p class="card-description">${desc}</p>
          <div class="card-meta">
            <span>⚙️ ${tpl.sections.length} ${appState.lang === 'ar' ? 'أقسام' : 'sections'}</span>
            <span>⭐ Template</span>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  // Bind click events
  setTimeout(() => {
    const buttons = document.querySelectorAll('.use-template-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tplId = e.target.getAttribute('data-tpl-id');
        const selected = currentTemplates.find(t => t.id === tplId);
        if (selected) {
          // Create new user project from template
          const newProj = storage.createProject(
            selected.name,
            selected.description,
            selected.theme,
            selected.font,
            appState.lang,
            JSON.parse(JSON.stringify(selected.sections)) // deep copy
          );
          onSelectTemplate(newProj);
        }
      });
    });
  }, 0);

  return html;
}
