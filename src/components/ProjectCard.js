// ProjectCard.js
import { storage } from '../utils/storage.js';

export function renderProjectCard(appState, project, isCommunityView, actions) {
  const trans = appState.translations;
  const isRTL = appState.lang === 'ar';
  
  // Decide icon based on language & status
  const deployedBadge = project.deployed?.isDeployed 
    ? `<span class="badge badge-primary">🌐 Published</span>`
    : `<span class="badge badge-secondary">📝 Draft</span>`;
    
  const publicBadge = project.isPublic
    ? `<span class="badge badge-primary" title="${trans.publicBadgeLabel}">🔓 ${trans.public}</span>`
    : `<span class="badge badge-secondary" title="${trans.privateBadgeLabel}">🔒 ${trans.private}</span>`;

  // Dynamic preview icons
  let previewChar = '📱';
  if (project.theme === 'theme-sunset') previewChar = '🌅';
  if (project.theme === 'theme-emerald') previewChar = '🌿';
  if (project.theme === 'theme-midnight') previewChar = '⚡';

  const viewLiveBtn = project.deployed?.isDeployed
    ? `<button class="btn btn-secondary btn-sm preview-live-btn" data-proj-id="${project.id}">
         👀 ${trans.preview}
       </button>`
    : `<button class="btn btn-secondary btn-sm edit-proj-btn" data-proj-id="${project.id}">
         ✏️ ${trans.edit}
       </button>`;

  const mainCardAction = isCommunityView
    ? `<button class="btn btn-primary btn-sm clone-proj-btn" data-proj-id="${project.id}">
         📥 ${trans.clone}
       </button>`
    : `<button class="btn btn-primary btn-sm edit-proj-btn" data-proj-id="${project.id}">
         🛠️ ${trans.edit}
       </button>`;

  const deleteBtn = !isCommunityView && !project.isSystem
    ? `<button class="btn btn-secondary btn-sm delete-proj-btn" data-proj-id="${project.id}" style="border-color: rgba(239, 68, 68, 0.2); color: #ef4444;" title="${trans.delete}">
         🗑️
       </button>`
    : '';

  const cloneBtn = !isCommunityView
    ? `<button class="btn btn-secondary btn-sm clone-proj-btn" data-proj-id="${project.id}" title="${trans.clone}">
         📋
       </button>`
    : '';

  return `
    <div class="project-card" data-card-id="${project.id}">
      <div class="card-thumbnail">
        <div class="card-thumbnail-pattern">${previewChar}</div>
        <div class="thumbnail-overlay">
          ${mainCardAction}
          ${viewLiveBtn}
        </div>
      </div>
      
      <div class="card-body">
        <div class="card-header-row">
          <h4 class="card-title">${project.name}</h4>
          <div style="display: flex; gap: 4px;">
            ${deployedBadge}
            ${!isCommunityView ? publicBadge : ''}
          </div>
        </div>
        <p class="card-description">${project.description || 'No description provided.'}</p>
        <div class="card-meta">
          <span>🎨 ${project.theme.split('-')[1].toUpperCase()}</span>
          <span>👥 ${project.clones || 0} ${trans.cloneCount}</span>
        </div>
      </div>
      <div class="card-actions" style="border-top: 1px solid var(--border-light); padding-top: 14px; margin-top: 0;">
        ${mainCardAction}
        ${cloneBtn}
        ${deleteBtn}
      </div>
    </div>
  `;
}

export function bindProjectCardEvents(appState, onEdit, onClone, onDelete, onPreview) {
  // Bind Edit buttons
  document.querySelectorAll('.edit-proj-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const projId = btn.getAttribute('data-proj-id');
      onEdit(projId);
    });
  });

  // Bind Clone buttons
  document.querySelectorAll('.clone-proj-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const projId = btn.getAttribute('data-proj-id');
      const cloned = storage.cloneProject(projId);
      if (cloned) {
        alert(appState.translations.alertClonedSuccess);
        onClone(cloned);
      }
    });
  });

  // Bind Delete buttons
  document.querySelectorAll('.delete-proj-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const projId = btn.getAttribute('data-proj-id');
      if (confirm(appState.lang === 'ar' ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?')) {
        storage.deleteProject(projId);
        onDelete();
      }
    });
  });

  // Bind Preview Live buttons
  document.querySelectorAll('.preview-live-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const projId = btn.getAttribute('data-proj-id');
      onPreview(projId);
    });
  });
}
