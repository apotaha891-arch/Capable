// VisualEditor.js
import { storage } from '../utils/storage.js';
import { openDeploymentWizard } from './DeploymentWizard.js';

export function renderVisualEditor(appState, project, onBackToDashboard) {
  const trans = appState.translations;
  const isRTL = appState.lang === 'ar';
  
  // Set default tabs active
  let activeEditorTab = 'sections'; // default tab

  // Outer editor shell HTML
  const html = `
    <div class="editor-container">
      
      <!-- Editor Header -->
      <header class="editor-header">
        <div class="editor-header-left">
          <button class="btn btn-secondary btn-sm" id="editor-back-btn">
            ${isRTL ? '⬅️' : '➡️'} ${trans.back}
          </button>
          <div style="display: flex; flex-direction: column;">
            <strong id="editor-project-title">${project.name}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);" id="save-status-indicator">Saved ✔️</span>
          </div>
        </div>
        
        <div class="editor-header-right">
          <!-- Viewport Simulator Controls -->
          <div class="device-toggle-group">
            <button class="device-btn active" data-device="desktop" title="Desktop View">🖥️</button>
            <button class="device-btn" data-device="tablet" title="Tablet View">📱</button>
            <button class="device-btn" data-device="mobile" title="Mobile View">🤳</button>
          </div>
          
          <button class="btn btn-accent btn-sm" id="editor-deploy-btn">
            🚀 ${trans.deploy}
          </button>
        </div>
      </header>

      <!-- Main Editor Workspace -->
      <div class="editor-workspace">
        
        <!-- Left Sidebar Panel -->
        <aside class="editor-sidebar">
          <div class="sidebar-tabs">
            <button class="sidebar-tab-btn" data-tab="styles">${trans.editorTabStyles}</button>
            <button class="sidebar-tab-btn active" data-tab="sections">${trans.editorTabSections}</button>
            <button class="sidebar-tab-btn" data-tab="integrations">${trans.editorTabIntegrations}</button>
          </div>
          
          <div class="sidebar-content" id="sidebar-content-area">
            <!-- Dynamic Sidebar content gets injected here -->
          </div>
        </aside>

        <!-- Live Preview Canvas -->
        <main class="editor-canvas-container">
          <div class="viewport-simulator" id="canvas-simulator">
            <!-- Simulated site layout content gets injected here -->
          </div>
        </main>

      </div>
    </div>

    <!-- Inline Editor Dialog (Overlay hidden by default) -->
    <div class="inline-edit-panel" id="inline-edit-panel" style="display: none;">
      <div class="inline-edit-bubble">
        <h4 style="font-size: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
          📝 ${trans.editElementTitle}
        </h4>
        <div class="input-group">
          <label class="input-label" id="inline-label">${trans.editElementLabel}</label>
          <textarea class="input-field" id="inline-text-textarea" rows="4" style="resize: none;"></textarea>
        </div>
        <div class="input-group" id="inline-image-group" style="display: none;">
          <label class="input-label">${trans.editElementImageLabel}</label>
          <input type="text" class="input-field" id="inline-image-url" />
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" id="inline-edit-cancel">${trans.cancel}</button>
          <button class="btn btn-primary btn-sm" id="inline-edit-save">${trans.editElementBtnSave}</button>
        </div>
      </div>
    </div>
  `;

  // Attach elements and event handlers
  setTimeout(() => {
    // 1. Mount Sidebar content based on active tab
    renderSidebarContent();
    
    // 2. Mount Canvas Preview
    renderCanvasPreview();

    // Bind Back Button
    document.getElementById('editor-back-btn').addEventListener('click', () => {
      onBackToDashboard();
    });

    // Bind Device Simulator Buttons
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const device = btn.getAttribute('data-device');
        
        const sim = document.getElementById('canvas-simulator');
        sim.className = 'viewport-simulator';
        if (device === 'tablet') sim.classList.add('tablet');
        if (device === 'mobile') sim.classList.add('mobile');
      });
    });

    // Bind Tab Click Handlers
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeEditorTab = btn.getAttribute('data-tab');
        renderSidebarContent();
      });
    });

    // Bind Deploy Button
    document.getElementById('editor-deploy-btn').addEventListener('click', () => {
      openDeploymentWizard(appState, project, (deployedProj) => {
        if (deployedProj) {
          project = deployedProj;
          document.getElementById('editor-project-title').innerText = project.name;
          renderCanvasPreview();
        }
      });
    });

  }, 0);

  // --- Sidebar Panel Rendering Logic ---
  function renderSidebarContent() {
    const container = document.getElementById('sidebar-content-area');
    if (!container) return;
    
    if (activeEditorTab === 'styles') {
      // Style options content
      container.innerHTML = `
        <div class="sidebar-group">
          <label class="sidebar-group-title">${trans.styleFontLabel}</label>
          <select class="input-field" id="style-font-select">
            <option value="font-arabic" ${project.font === 'font-arabic' ? 'selected' : ''}>Cairo (Arabic First)</option>
            <option value="font-english" ${project.font === 'font-english' ? 'selected' : ''}>Outfit (English First)</option>
          </select>
        </div>

        <div class="sidebar-group">
          <label class="sidebar-group-title">${trans.styleColorLabel}</label>
          <div class="theme-swatches">
            <div class="theme-swatch ${project.theme === 'theme-sunset' ? 'active' : ''}" data-theme="theme-sunset">
              <span class="swatch-name">${trans.aiColorSunset}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #f97316;"></div>
                <div class="swatch-color" style="background-color: #18181b;"></div>
              </div>
            </div>
            
            <div class="theme-swatch ${project.theme === 'theme-emerald' ? 'active' : ''}" data-theme="theme-emerald">
              <span class="swatch-name">${trans.aiColorEmerald}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #10b981;"></div>
                <div class="swatch-color" style="background-color: #f4f6f4;"></div>
              </div>
            </div>

            <div class="theme-swatch ${project.theme === 'theme-midnight' ? 'active' : ''}" data-theme="theme-midnight">
              <span class="swatch-name">${trans.aiColorMidnight}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #8b5cf6;"></div>
                <div class="swatch-color" style="background-color: #0f172a;"></div>
              </div>
            </div>

            <div class="theme-swatch ${project.theme === 'theme-corporate' ? 'active' : ''}" data-theme="theme-corporate">
              <span class="swatch-name">${trans.aiColorCorporate}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #1e3a8a;"></div>
                <div class="swatch-color" style="background-color: #ffffff;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Bind events for Style panel
      document.getElementById('style-font-select').addEventListener('change', (e) => {
        project.font = e.target.value;
        saveProjectState();
        renderCanvasPreview();
      });

      document.querySelectorAll('.theme-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
          document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
          project.theme = sw.getAttribute('data-theme');
          saveProjectState();
          renderCanvasPreview();
        });
      });

    } else if (activeEditorTab === 'sections') {
      // Active Sections Outline
      let sectionListHtml = '';
      project.sections.forEach((sec, index) => {
        let secName = trans.secHero;
        if (sec.type === 'features') secName = trans.secFeatures;
        if (sec.type === 'gallery') secName = trans.secGallery;
        if (sec.type === 'contact') secName = trans.secContact;
        if (sec.type === 'footer') secName = trans.secFooter;

        const upDisabled = index === 0 ? 'disabled' : '';
        const downDisabled = index === project.sections.length - 1 ? 'disabled' : '';
        
        sectionListHtml += `
          <div class="section-list-item" data-sec-idx="${index}">
            <div class="section-item-info">
              <span class="section-item-icon">🧩</span>
              <strong>${secName}</strong>
            </div>
            <div class="section-item-actions">
              <button class="action-icon-btn move-up" ${upDisabled} title="Move Up">▲</button>
              <button class="action-icon-btn move-down" ${downDisabled} title="Move Down">▼</button>
              <button class="action-icon-btn delete delete-sec" title="Delete">🗑️</button>
            </div>
          </div>
        `;
      });

      container.innerHTML = `
        <div class="sidebar-group">
          <label class="sidebar-group-title">${trans.sectionsCurrent}</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${project.sections.length === 0 ? `<p style="font-size: 0.85rem; color: var(--text-muted);">${trans.sectionsEmpty}</p>` : sectionListHtml}
          </div>
        </div>

        <div class="sidebar-group" style="margin-top: 10px;">
          <label class="sidebar-group-title">${trans.sectionsAdd}</label>
          <div class="add-section-grid">
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="hero">＋ ${trans.secHero}</button>
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="features">＋ ${trans.secFeatures}</button>
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="gallery">＋ ${trans.secGallery}</button>
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="contact">＋ ${trans.secContact}</button>
          </div>
        </div>
      `;

      // Bind Section Management Actions
      document.querySelectorAll('.move-up').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.closest('.section-list-item').getAttribute('data-sec-idx'));
          if (idx > 0) {
            const temp = project.sections[idx];
            project.sections[idx] = project.sections[idx - 1];
            project.sections[idx - 1] = temp;
            saveProjectState();
            renderSidebarContent();
            renderCanvasPreview();
          }
        });
      });

      document.querySelectorAll('.move-down').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.closest('.section-list-item').getAttribute('data-sec-idx'));
          if (idx < project.sections.length - 1) {
            const temp = project.sections[idx];
            project.sections[idx] = project.sections[idx + 1];
            project.sections[idx + 1] = temp;
            saveProjectState();
            renderSidebarContent();
            renderCanvasPreview();
          }
        });
      });

      document.querySelectorAll('.delete-sec').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.closest('.section-list-item').getAttribute('data-sec-idx'));
          if (confirm(appState.lang === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this section?')) {
            project.sections.splice(idx, 1);
            saveProjectState();
            renderSidebarContent();
            renderCanvasPreview();
          }
        });
      });

      // Bind Add section
      document.querySelectorAll('.add-sec-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-type');
          addSectionTemplate(type);
        });
      });

    } else if (activeEditorTab === 'integrations') {
      // Integration details
      const isPublicChecked = project.isPublic ? 'checked' : '';
      
      container.innerHTML = `
        <div class="sidebar-group">
          <label class="sidebar-group-title">${trans.projSettingsTitle}</label>
          
          <div class="input-group">
            <label class="input-label" for="editor-proj-name">${trans.projNameLabel}</label>
            <input type="text" class="input-field" id="editor-proj-name" value="${project.name}" />
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
            <input type="checkbox" id="editor-proj-public" style="width: 18px; height: 18px; cursor: pointer;" ${isPublicChecked} />
            <label for="editor-proj-public" style="font-size: 0.9rem; color: var(--text-secondary); cursor: pointer;">
              ${trans.projIsPublicLabel}
            </label>
          </div>
        </div>

        <div class="sidebar-group">
          <label class="sidebar-group-title">🔗 Form webhook API</label>
          <div class="input-group" style="margin-bottom: 0;">
            <input type="text" class="input-field" id="editor-webhook-val" value="${project.deployed?.webhookUrl || ''}" placeholder="https://api.mycompany.com/webhook" style="direction: ltr;" />
            <button class="btn btn-secondary btn-sm" id="editor-webhook-save-btn" style="margin-top: 10px; align-self: flex-start;">
              ${trans.save}
            </button>
          </div>
        </div>
      `;

      // Bind events
      const nameInput = document.getElementById('editor-proj-name');
      nameInput.addEventListener('change', () => {
        project.name = nameInput.value.trim() || project.name;
        document.getElementById('editor-project-title').innerText = project.name;
        saveProjectState();
      });

      const checkPublic = document.getElementById('editor-proj-public');
      checkPublic.addEventListener('change', () => {
        project.isPublic = checkPublic.checked;
        saveProjectState();
      });

      document.getElementById('editor-webhook-save-btn').addEventListener('click', () => {
        const whUrl = document.getElementById('editor-webhook-val').value.trim();
        if (!project.deployed) {
          project.deployed = { isDeployed: false, subdomain: '', customDomain: '', dnsVerified: false, webhookUrl: '' };
        }
        project.deployed.webhookUrl = whUrl;
        saveProjectState();
        alert(trans.alertSiteSaved);
      });
    }
  }

  // Add Default Section Item Schema
  function addSectionTemplate(type) {
    let sec = { id: `${type}_${Math.random().toString(36).substr(2, 5)}`, type: type, content: {} };
    
    if (appState.lang === 'ar') {
      if (type === 'hero') {
        sec.content = { title: 'عنوان رئيسي جذاب لموقعك', subtitle: 'اكتب هنا عبارة فرعية تشرح بالتفصيل القيمة التي تقدمها لعملائك المستهدفين.', ctaText: 'اتصل بنا', ctaLink: '#contact' };
      } else if (type === 'features') {
        sec.content = { title: 'ميزات خدماتنا', subtitle: 'نسعى دائماً لتقديم الأفضل لراحتكم ونمو أعمالكم', items: [
          { icon: '⭐', title: 'جودة استثنائية', desc: 'نضمن لك الدقة والاحترافية العالية في جميع تفاصيل تسليم خدماتنا.' },
          { icon: '⏰', title: 'التزام بالمواعيد', desc: 'نهتم بالوقت كقيمة أساسية ونسلم المشاريع في الأوقات المحددة تماماً.' }
        ]};
      } else if (type === 'gallery') {
        sec.content = { title: 'معرض أعمالنا المتميز', subtitle: 'استعرض معنا لقطات واقعية من مشاريعنا الأخيرة', items: [
          { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80', caption: 'تصميم وبناء رقمي' },
          { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80', caption: 'لوحات بيانات تفاعلية' }
        ]};
      } else if (type === 'contact') {
        sec.content = { title: 'اتصل بنا اليوم', subtitle: 'اترك رسالتك وسيتواصل معك خبراؤنا مباشرة لتلبية طلبك.', fields: ['name', 'phone', 'notes'] };
      } else if (type === 'footer') {
        sec.content = { text: 'جميع الحقوق محفوظة © 2026', links: 'الرئيسية | تواصل معنا' };
      }
    } else {
      if (type === 'hero') {
        sec.content = { title: 'Welcome to Your Brand New Site', subtitle: 'Describe your primary sales value here to hook your prospective client instantly.', ctaText: 'Contact Us', ctaLink: '#contact' };
      } else if (type === 'features') {
        sec.content = { title: 'Why Choose Our Team', subtitle: 'Explore the key parameters that define our operational values', items: [
          { icon: '⭐', title: 'Top-Tier Quality', desc: 'We deliver clean, scalable components tested across modern layouts.' },
          { icon: '⏰', title: 'Timely Operations', desc: 'Every sprint planning ensures milestone deliveries are met on schedule.' }
        ]};
      } else if (type === 'gallery') {
        sec.content = { title: 'Our Design Portfolio', subtitle: 'Inspect visual mockups and case deliverables built recently', items: [
          { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80', caption: 'Digital Architecture' },
          { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80', caption: 'Data Visualization Grid' }
        ]};
      } else if (type === 'contact') {
        sec.content = { title: 'Let\'s Start a Project', subtitle: 'Drop your details below, and our account representative will reach out in hours.', fields: ['name', 'email', 'notes'] };
      } else if (type === 'footer') {
        sec.content = { text: '© 2026 Your Brand Space. All rights reserved.', links: 'Privacy Policy | Terms' };
      }
    }

    project.sections.push(sec);
    saveProjectState();
    renderSidebarContent();
    renderCanvasPreview();
  }

  // Save changes wrapper
  function saveProjectState() {
    const indicator = document.getElementById('save-status-indicator');
    if (indicator) {
      indicator.innerHTML = '⏳ Saving...';
    }
    storage.saveProject(project);
    setTimeout(() => {
      if (indicator) indicator.innerHTML = 'Saved ✔️';
    }, 400);
  }

  // --- Live Preview Canvas Compiler Logic ---
  function renderCanvasPreview() {
    const canvas = document.getElementById('canvas-simulator');
    if (!canvas) return;

    if (project.sections.length === 0) {
      canvas.innerHTML = `
        <div class="simulator-empty-canvas">
          <span>🧩</span>
          <p>${trans.sectionsEmpty}</p>
        </div>
      `;
      return;
    }

    // Set dir, language & theme variables on simulator container wrapper
    const fontClass = project.font || 'font-arabic';
    const siteDir = project.language === 'ar' ? 'rtl' : 'ltr';
    const activeTheme = project.theme || 'theme-corporate';

    // Renders custom layout output HTML
    let siteHtml = `
      <div class="web-preview ${activeTheme} ${fontClass}" dir="${siteDir}" lang="${project.language}" style="min-height: 100%;">
    `;

    project.sections.forEach((sec, secIdx) => {
      if (sec.type === 'hero') {
        siteHtml += `
          <header class="web-section web-hero" id="${sec.id}">
            <div class="web-container">
              <h1 class="web-hero-title editable-component" data-sec-idx="${secIdx}" data-field="title">${sec.content.title}</h1>
              <p class="web-hero-desc editable-component" data-sec-idx="${secIdx}" data-field="subtitle">${sec.content.subtitle}</p>
              <div>
                <a href="${sec.content.ctaLink || '#contact'}" class="web-btn editable-component" data-sec-idx="${secIdx}" data-field="ctaText">
                  ${sec.content.ctaText}
                </a>
              </div>
            </div>
          </header>
        `;
      } else if (sec.type === 'features') {
        let cardsHtml = '';
        (sec.content.items || []).forEach((item, itemIdx) => {
          cardsHtml += `
            <div class="web-card">
              <div class="web-card-icon editable-component" data-sec-idx="${secIdx}" data-field="items-icon" data-item-idx="${itemIdx}">${item.icon}</div>
              <h3 class="web-card-title editable-component" data-sec-idx="${secIdx}" data-field="items-title" data-item-idx="${itemIdx}">${item.title}</h3>
              <p class="web-card-desc editable-component" data-sec-idx="${secIdx}" data-field="items-desc" data-item-idx="${itemIdx}">${item.desc}</p>
            </div>
          `;
        });

        siteHtml += `
          <section class="web-section" id="${sec.id}">
            <div class="web-container">
              <h2 class="web-section-title editable-component" data-sec-idx="${secIdx}" data-field="title">${sec.content.title}</h2>
              <p class="web-section-subtitle editable-component" data-sec-idx="${secIdx}" data-field="subtitle">${sec.content.subtitle}</p>
              <div class="web-grid-3">
                ${cardsHtml}
              </div>
            </div>
          </section>
        `;
      } else if (sec.type === 'gallery') {
        let itemsHtml = '';
        (sec.content.items || []).forEach((item, itemIdx) => {
          itemsHtml += `
            <div class="web-gallery-item editable-component" data-sec-idx="${secIdx}" data-field="gallery-item" data-item-idx="${itemIdx}">
              <img src="${item.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80'}" alt="" />
              <div class="web-gallery-caption">${item.caption}</div>
            </div>
          `;
        });

        siteHtml += `
          <section class="web-section" id="${sec.id}">
            <div class="web-container">
              <h2 class="web-section-title editable-component" data-sec-idx="${secIdx}" data-field="title">${sec.content.title}</h2>
              <p class="web-section-subtitle editable-component" data-sec-idx="${secIdx}" data-field="subtitle">${sec.content.subtitle}</p>
              <div class="web-gallery-grid">
                ${itemsHtml}
              </div>
            </div>
          </section>
        `;
      } else if (sec.type === 'contact') {
        let fieldsHtml = '';
        (sec.content.fields || []).forEach(f => {
          if (f === 'notes') {
            fieldsHtml += `<textarea class="web-textarea" placeholder="${project.language === 'ar' ? 'رسالتك وملاحظاتك...' : 'Your notes/message...'}" readonly></textarea>`;
          } else {
            let label = f.toUpperCase();
            if (f === 'name') label = project.language === 'ar' ? 'الاسم الكامل' : 'Full Name';
            if (f === 'phone') label = project.language === 'ar' ? 'رقم الهاتف' : 'Phone Number';
            if (f === 'email') label = project.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address';
            if (f === 'date') label = project.language === 'ar' ? 'التاريخ والوقت المطلبان' : 'Booking Date/Time';
            
            fieldsHtml += `<input type="text" class="web-input" placeholder="${label}" readonly />`;
          }
        });

        siteHtml += `
          <section class="web-section" id="${sec.id}">
            <div class="web-container">
              <h2 class="web-section-title editable-component" data-sec-idx="${secIdx}" data-field="title">${sec.content.title}</h2>
              <p class="web-section-subtitle editable-component" data-sec-idx="${secIdx}" data-field="subtitle">${sec.content.subtitle}</p>
              
              <div class="web-contact-form">
                ${fieldsHtml}
                <button class="web-btn" style="width: 100%; justify-content: center; font-size: 1rem;">
                  ${project.language === 'ar' ? trans.formSubmitBtn : trans.formSubmitBtn}
                </button>
              </div>
            </div>
          </section>
        `;
      } else if (sec.type === 'footer') {
        siteHtml += `
          <footer class="web-footer" id="${sec.id}">
            <div class="web-footer-container">
              <p class="editable-component" data-sec-idx="${secIdx}" data-field="text">${sec.content.text}</p>
              <p style="font-size: 0.8rem; opacity: 0.8;" class="editable-component" data-sec-idx="${secIdx}" data-field="links">
                ${sec.content.links}
              </p>
            </div>
          </footer>
        `;
      }
    });

    siteHtml += `</div>`;
    canvas.innerHTML = siteHtml;

    // Attach In-context editing listeners on elements
    bindInlineEditTriggers();
  }

  // --- Inline Text Editor Logic ---
  let activeEditSecIdx = null;
  let activeEditField = null;
  let activeEditItemIdx = null;

  function bindInlineEditTriggers() {
    const editables = document.querySelectorAll('.editable-component');
    editables.forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        activeEditSecIdx = parseInt(el.getAttribute('data-sec-idx'));
        activeEditField = el.getAttribute('data-field');
        
        const itemIdxVal = el.getAttribute('data-item-idx');
        activeEditItemIdx = itemIdxVal !== null ? parseInt(itemIdxVal) : null;

        // Open Dialog
        openInlinePanel(el);
      });
    });
  }

  function openInlinePanel(element) {
    const panel = document.getElementById('inline-edit-panel');
    const textarea = document.getElementById('inline-text-textarea');
    const imgGroup = document.getElementById('inline-image-group');
    const imgInput = document.getElementById('inline-image-url');
    const label = document.getElementById('inline-label');

    // Retrieve target value
    let val = '';
    const section = project.sections[activeEditSecIdx];
    
    if (activeEditItemIdx === null) {
      val = section.content[activeEditField];
    } else {
      if (activeEditField === 'gallery-item') {
        val = section.content.items[activeEditItemIdx].caption;
        imgInput.value = section.content.items[activeEditItemIdx].url;
        imgGroup.style.display = 'block';
      } else {
        const itemSubfield = activeEditField.replace('items-', '');
        val = section.content.items[activeEditItemIdx][itemSubfield];
        imgGroup.style.display = 'none';
      }
    }

    textarea.value = val;
    label.innerText = appState.lang === 'ar' ? 'المحتوى النصي الجديد' : 'New Text Content';

    panel.style.display = 'flex';

    // Bind Close panel
    const cancelBtn = document.getElementById('inline-edit-cancel');
    const saveBtn = document.getElementById('inline-edit-save');

    // Remove old listeners
    const newCancel = cancelBtn.cloneNode(true);
    const newSave = saveBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);

    newCancel.addEventListener('click', () => {
      panel.style.display = 'none';
    });

    newSave.addEventListener('click', () => {
      const newVal = textarea.value.trim();
      
      const sec = project.sections[activeEditSecIdx];
      if (activeEditItemIdx === null) {
        sec.content[activeEditField] = newVal;
      } else {
        if (activeEditField === 'gallery-item') {
          sec.content.items[activeEditItemIdx].caption = newVal;
          sec.content.items[activeEditItemIdx].url = imgInput.value.trim();
        } else {
          const itemSubfield = activeEditField.replace('items-', '');
          sec.content.items[activeEditItemIdx][itemSubfield] = newVal;
        }
      }

      saveProjectState();
      panel.style.display = 'none';
      renderCanvasPreview();
    });
  }

  return html;
}
