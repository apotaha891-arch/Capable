// VisualEditor.js
import { storage } from '../utils/storage.js';
import { openDeploymentWizard } from './DeploymentWizard.js';

const chatHistories = {};

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
          
          <button class="btn btn-secondary btn-sm" id="editor-preview-btn">
            ${trans.previewNewWindow}
          </button>
          
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
            <button class="sidebar-tab-btn" data-tab="copilot">🤖 ${trans.editorTabCopilot}</button>
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

    // Bind Preview Button
    document.getElementById('editor-preview-btn').addEventListener('click', () => {
      window.open(`${window.location.origin}${window.location.pathname}#site/${project.id}`, '_blank');
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
    } else if (activeEditorTab === 'copilot') {
      renderCopilotTab(container);
    }
  }

  // --- AI Copilot Sidebar Tab Component ---
  function renderCopilotTab(container) {
    if (!chatHistories[project.id]) {
      chatHistories[project.id] = [
        { sender: 'assistant', text: trans.copilotGreeting }
      ];
    }
    const history = chatHistories[project.id];

    let messagesHtml = '';
    history.forEach(msg => {
      messagesHtml += `
        <div class="copilot-bubble ${msg.sender}">
          ${msg.text}
        </div>
      `;
    });

    const currentProvider = localStorage.getItem('copilot_provider') || 'offline';
    const settingsOpen = localStorage.getItem('copilot_settings_open') === 'true';

    container.innerHTML = `
      <div class="copilot-chat-container">
        <!-- Collapsible Settings Panel -->
        <details class="copilot-settings-details" style="background: var(--bg-base); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 8px;" ${settingsOpen ? 'open' : ''}>
          <summary style="font-size: 0.75rem; font-weight: 700; cursor: pointer; color: var(--text-secondary); user-select: none;">
            ⚙️ AI Provider (إعدادات الذكاء الاصطناعي)
          </summary>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
            <div class="input-group" style="margin-bottom: 0;">
              <label class="input-label" style="font-size: 0.7rem; color: var(--text-muted);">Provider (المزود)</label>
              <select class="input-field" id="copilot-provider-select" style="font-size: 0.8rem; padding: 6px 10px;">
                <option value="offline" ${currentProvider === 'offline' ? 'selected' : ''}>Offline Fallback (محلي بدون إنترنت)</option>
                <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>Ollama (Local LLM)</option>
                <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>Hugging Face API</option>
              </select>
            </div>
            
            <div id="copilot-settings-hf" style="display: ${currentProvider === 'huggingface' ? 'flex' : 'none'}; flex-direction: column; gap: 8px;">
              <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label" style="font-size: 0.7rem; color: var(--text-muted);">API Token (مفتاح API)</label>
                <input type="password" class="input-field" id="copilot-hf-token" value="${localStorage.getItem('copilot_hf_token') || ''}" placeholder="hf_..." style="font-size: 0.8rem; padding: 6px 10px;" />
              </div>
              <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label" style="font-size: 0.7rem; color: var(--text-muted);">Model ID (الموديل)</label>
                <input type="text" class="input-field" id="copilot-hf-model" value="${localStorage.getItem('copilot_hf_model') || 'meta-llama/Meta-Llama-3-8B-Instruct'}" style="font-size: 0.8rem; padding: 6px 10px; font-family: monospace;" />
              </div>
            </div>

            <div id="copilot-settings-ollama" style="display: ${currentProvider === 'ollama' ? 'flex' : 'none'}; flex-direction: column; gap: 8px;">
              <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label" style="font-size: 0.7rem; color: var(--text-muted);">Ollama Host (الرابط)</label>
                <input type="text" class="input-field" id="copilot-ollama-host" value="${localStorage.getItem('copilot_ollama_host') || 'http://localhost:11434'}" style="font-size: 0.8rem; padding: 6px 10px; font-family: monospace;" />
              </div>
              <div class="input-group" style="margin-bottom: 0;">
                <label class="input-label" style="font-size: 0.7rem; color: var(--text-muted);">Model Name (اسم الموديل)</label>
                <input type="text" class="input-field" id="copilot-ollama-model" value="${localStorage.getItem('copilot_ollama_model') || 'llama3'}" style="font-size: 0.8rem; padding: 6px 10px; font-family: monospace;" />
              </div>
            </div>
          </div>
        </details>

        <div class="copilot-messages" id="copilot-msg-stream">
          ${messagesHtml}
        </div>
        
        <div class="copilot-input-area">
          <div id="copilot-typing-indicator" style="display: none; margin-bottom: 4px;">
            <div class="copilot-typing">
              <span class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></span>
              <span>${trans.copilotTyping}</span>
            </div>
          </div>
          
          <div class="copilot-input-row">
            <textarea class="copilot-textarea" id="copilot-input-field" placeholder="${trans.copilotPlaceholder}"></textarea>
            <button class="copilot-send-btn" id="copilot-send-btn">
              ${trans.copilotSend}
            </button>
          </div>
        </div>
      </div>
    `;

    // Scroll to bottom
    const stream = document.getElementById('copilot-msg-stream');
    if (stream) stream.scrollTop = stream.scrollHeight;

    // Grab elements
    const detailsEl = container.querySelector('.copilot-settings-details');
    const providerSelect = document.getElementById('copilot-provider-select');
    const hfSettings = document.getElementById('copilot-settings-hf');
    const ollamaSettings = document.getElementById('copilot-settings-ollama');
    const hfToken = document.getElementById('copilot-hf-token');
    const hfModel = document.getElementById('copilot-hf-model');
    const ollamaHost = document.getElementById('copilot-ollama-host');
    const ollamaModel = document.getElementById('copilot-ollama-model');

    const inputField = document.getElementById('copilot-input-field');
    const sendBtn = document.getElementById('copilot-send-btn');

    // Bind settings events
    if (detailsEl) {
      detailsEl.addEventListener('toggle', () => {
        localStorage.setItem('copilot_settings_open', detailsEl.open);
      });
    }

    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        const val = providerSelect.value;
        localStorage.setItem('copilot_provider', val);
        hfSettings.style.display = val === 'huggingface' ? 'flex' : 'none';
        ollamaSettings.style.display = val === 'ollama' ? 'flex' : 'none';
      });
    }

    if (hfToken) {
      hfToken.addEventListener('change', () => {
        localStorage.setItem('copilot_hf_token', hfToken.value.trim());
      });
    }

    if (hfModel) {
      hfModel.addEventListener('change', () => {
        localStorage.setItem('copilot_hf_model', hfModel.value.trim());
      });
    }

    if (ollamaHost) {
      ollamaHost.addEventListener('change', () => {
        localStorage.setItem('copilot_ollama_host', ollamaHost.value.trim());
      });
    }

    if (ollamaModel) {
      ollamaModel.addEventListener('change', () => {
        localStorage.setItem('copilot_ollama_model', ollamaModel.value.trim());
      });
    }

    const handleSend = () => {
      const promptText = inputField.value.trim();
      if (!promptText) return;

      inputField.value = '';

      // Add user message
      history.push({ sender: 'user', text: promptText });
      renderCopilotTab(container);

      // Show typing status
      const typingIndicator = document.getElementById('copilot-typing-indicator');
      if (typingIndicator) typingIndicator.style.display = 'block';

      const stream = document.getElementById('copilot-msg-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;

      setTimeout(async () => {
        let responseText = '';
        try {
          responseText = await processCopilotCommandAsync(promptText);
        } catch (err) {
          console.warn("AI LLM failed, falling back to offline parser:", err);
          const offlineResponse = processCopilotCommand(promptText);
          const isAR = appState.lang === 'ar';
          responseText = isAR 
            ? `⚠️ (فشل الاتصال بالنموذج: ${err.message}. تم استخدام المحلل المحلي الاحتياطي.)\n\n${offlineResponse}`
            : `⚠️ (API Connection failed: ${err.message}. Offline fallback used.)\n\n${offlineResponse}`;
        }
        
        if (typingIndicator) typingIndicator.style.display = 'none';

        // Add assistant message
        history.push({ sender: 'assistant', text: responseText });
        renderCopilotTab(container);
      }, 500);
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // --- AI Copilot Natural Language Parser & Action Handler ---
  function processCopilotCommand(text) {
    const isAR = appState.lang === 'ar';
    const trans = appState.translations;

    // Helper: Normalize string (handles Arabic Alif, Teh Marbuta, Yeh, and diacritics)
    const normalize = (str) => {
      if (!str) return "";
      return str.toLowerCase().trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');
    };

    const normalizedInput = normalize(text);
    
    // Helper to check if a keyword matches
    const hasWord = (keywords) => {
      const normalizedKeywords = keywords.map(k => normalize(k));
      return normalizedKeywords.some(k => normalizedInput.includes(k));
    };

    // Special context handler for incomplete name/title complaints
    if (hasWord(['ناقص', 'مفقود', 'غير مكتمل', 'ناقصه', 'مبتور', 'تكملة', 'تكمله']) && hasWord(['اسم', 'عنوان', 'المنشاه', 'الشركة', 'الموقع', 'المؤسسة'])) {
      return isAR
        ? "عذراً على ذلك! يبدو أن اسم المنشأة غير مكتمل بالفعل في عنوان الموقع.\n\nيرجى كتابة الاسم الذي تريده بوضوح مع أمر التعديل، مثل:\n• **'غير الاسم إلى مكتب الهدى للمحاماة'**\n• **'تعديل العنوان إلى مكتب المحاماة والاستشارات'**"
        : "Apologies! It seems the name is incomplete. Please type the correct name clearly with the edit command, for example:\n• **'change name to Al-Huda Law Firm'**\n• **'edit title to Law & Consultations Office'**";
    }

    // 1. Rename website title
    if (hasWord(['اسم', 'تسمية', 'تسميه']) && hasWord(['تغيير', 'تعديل', 'غير', 'بدل', 'سمى', 'تحديث', 'تسميه', 'تسمية'])) {
      let newName = '';
      if (isAR) {
        const matches = text.match(/(?:إلى|الى|هو)\s+(.+)$/i);
        if (matches) newName = matches[1].trim();
      } else {
        const matches = text.match(/(?:to|is)\s+(.+)$/i);
        if (matches) newName = matches[1].trim();
      }

      if (newName) {
        project.name = newName;
        const titleEl = document.getElementById('editor-project-title');
        if (titleEl) titleEl.innerText = newName;
        saveProjectState();
        return trans.copilotSuccessRename;
      }
    }

    // 2. Change Color Theme style
    if (hasWord(['لون', 'الوان', 'مظهر', 'ثيم', 'شكل'])) {
      let newTheme = null;
      if (hasWord(['بنفسجي', 'ميدنايت', 'الليل', 'غامق', 'مظلم'])) {
        newTheme = 'theme-midnight';
      } else if (hasWord(['اخضر', 'زمرد', 'طبيعي', 'بيج'])) {
        newTheme = 'theme-emerald';
      } else if (hasWord(['برتقالي', 'غروب', 'دافئ', 'احمر'])) {
        newTheme = 'theme-sunset';
      } else if (hasWord(['ازرق', 'رسمي', 'شركات', 'عملي'])) {
        newTheme = 'theme-corporate';
      }

      if (newTheme) {
        project.theme = newTheme;
        saveProjectState();
        renderCanvasPreview();
        return trans.copilotSuccessTheme;
      }
    }

    // 3. Change Font typography
    if (hasWord(['خط', 'الخط'])) {
      let newFont = null;
      if (hasWord(['عربي', 'بلد', 'القاهرة', 'cairo'])) {
        newFont = 'font-arabic';
      } else if (hasWord(['انجليزي', 'لاتيني', 'outfit'])) {
        newFont = 'font-english';
      }

      if (newFont) {
        project.font = newFont;
        saveProjectState();
        renderCanvasPreview();
        return trans.copilotSuccessFont;
      }
    }

    // 4. Delete section
    if (hasWord(['احذف', 'حذف', 'ازالة', 'مسح'])) {
      let typeToDelete = null;
      if (hasWord(['هيرو', 'بطل', 'واجه', 'رئيسي'])) {
        typeToDelete = 'hero';
      } else if (hasWord(['مميزات', 'خدمات', 'ميزات'])) {
        typeToDelete = 'features';
      } else if (hasWord(['معرض', 'صور', 'البوم'])) {
        typeToDelete = 'gallery';
      } else if (hasWord(['اتصال', 'حجز', 'نموذج'])) {
        typeToDelete = 'contact';
      } else if (hasWord(['تذييل', 'اخير', 'روابط'])) {
        typeToDelete = 'footer';
      }

      if (typeToDelete) {
        const idx = project.sections.findIndex(s => s.type === typeToDelete);
        if (idx !== -1) {
          project.sections.splice(idx, 1);
          saveProjectState();
          renderCanvasPreview();
          return trans.copilotSuccessSectionDel;
        }
      }
    }

    // 5. Add section
    if (hasWord(['اضف', 'اضافه', 'وضع', 'جديد'])) {
      let typeToAdd = null;
      if (hasWord(['هيرو', 'بطل', 'واجه', 'رئيسي'])) {
        typeToAdd = 'hero';
      } else if (hasWord(['مميزات', 'خدمات', 'ميزات'])) {
        typeToAdd = 'features';
      } else if (hasWord(['معرض', 'صور', 'البوم'])) {
        typeToAdd = 'gallery';
      } else if (hasWord(['اتصال', 'حجز', 'نموذج'])) {
        typeToAdd = 'contact';
      } else if (hasWord(['تذييل', 'اخير', 'روابط'])) {
        typeToAdd = 'footer';
      }

      if (typeToAdd) {
        addSectionTemplate(typeToAdd);
        return trans.copilotSuccessSectionAdd;
      }
    }

    // 6. Edit Hero Title
    if (hasWord(['عنوان الهيرو', 'عنوان البطل', 'عنوان الواجه', 'العنوان الرئيسي', 'عنوان الموقع', 'عنوان']) && !hasWord(['فرعي'])) {
      let newTitle = '';
      if (isAR) {
        const matches = text.match(/(?:إلى|الى|هو)\s+(.+)$/i);
        if (matches) newTitle = matches[1].trim();
      } else {
        const matches = text.match(/(?:to|is)\s+(.+)$/i);
        if (matches) newTitle = matches[1].trim();
      }

      if (newTitle) {
        const heroSec = project.sections.find(s => s.type === 'hero');
        if (heroSec) {
          heroSec.content.title = newTitle;
          saveProjectState();
          renderCanvasPreview();
          return trans.copilotSuccessHeroEdit;
        }
      }
    }

    // 7. Edit Hero Subtitle
    if (hasWord(['عنوان فرعي', 'العنوان الفرعي', 'شرح البطل', 'الوصف الفرعي', 'وصف فرعي'])) {
      let newSubtitle = '';
      if (isAR) {
        const matches = text.match(/(?:إلى|الى|هو)\s+(.+)$/i);
        if (matches) newSubtitle = matches[1].trim();
      } else {
        const matches = text.match(/(?:to|is)\s+(.+)$/i);
        if (matches) newSubtitle = matches[1].trim();
      }

      if (newSubtitle) {
        const heroSec = project.sections.find(s => s.type === 'hero');
        if (heroSec) {
          heroSec.content.subtitle = newSubtitle;
          saveProjectState();
          renderCanvasPreview();
          return trans.copilotSuccessHeroEdit;
        }
      }
    }

    return trans.copilotUnknown;
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

  // --- AI Copilot Async Integration (Ollama / Hugging Face) ---
  async function processCopilotCommandAsync(text) {
    const provider = localStorage.getItem('copilot_provider') || 'offline';
    
    if (provider === 'offline') {
      return processCopilotCommand(text);
    }

    const systemPrompt = `You are a professional website builder AI. You receive the current website project JSON and a user editing instruction. Your task is to modify the project JSON according to the instruction.
    
    Here is the project JSON schema:
    - name: string (the website title/name)
    - description: string
    - theme: 'theme-sunset' | 'theme-emerald' | 'theme-midnight' | 'theme-corporate'
    - font: 'font-arabic' | 'font-english'
    - sections: array of section objects. Each section has:
      - id: string (unique identifier)
      - type: 'hero' | 'features' | 'gallery' | 'contact' | 'footer'
      - content: object depending on type.
        - hero: { title, subtitle, ctaText, ctaLink }
        - features: { title, subtitle, items: [{ icon, title, desc }] }
        - gallery: { title, subtitle, items: [{ url, caption }] }
        - contact: { title, subtitle, fields: array of ('name'|'phone'|'email'|'date'|'notes') }
        - footer: { text, links }

    You MUST respond ONLY with the updated project JSON object. Do not wrap it in markdown codeblocks (like \`\`\`json) or add any conversational text. Return only valid raw JSON.`;

    const userPrompt = `Current Project JSON:\n${JSON.stringify(project)}\n\nUser Instruction:\n${text}`;

    if (provider === 'ollama') {
      const host = localStorage.getItem('copilot_ollama_host') || 'http://localhost:11434';
      const model = localStorage.getItem('copilot_ollama_model') || 'llama3';

      const res = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false
        })
      });

      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
      const data = await res.json();
      const content = data.message?.content || data.response || '';
      return applyUpdatedProjectJSON(content);
    }

    if (provider === 'huggingface') {
      const token = localStorage.getItem('copilot_hf_token') || '';
      const model = localStorage.getItem('copilot_hf_model') || 'meta-llama/Meta-Llama-3-8B-Instruct';

      const hfPrompt = `<|system|>\n${systemPrompt}\n<|user|>\n${userPrompt}\n<|assistant|>\n`;

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          inputs: hfPrompt,
          parameters: { max_new_tokens: 1500, return_full_text: false }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Hugging Face returned status ${res.status}`);
      }

      const data = await res.json();
      const generatedText = Array.isArray(data) ? data[0].generated_text : data.generated_text || '';
      return applyUpdatedProjectJSON(generatedText);
    }
  }

  function applyUpdatedProjectJSON(responseText) {
    try {
      const cleanJson = extractJSON(responseText);
      const updated = JSON.parse(cleanJson);

      if (!updated.sections || !Array.isArray(updated.sections)) {
        throw new Error("Invalid project structure returned by AI model.");
      }

      project.name = updated.name || project.name;
      project.description = updated.description || project.description;
      project.theme = updated.theme || project.theme;
      project.font = updated.font || project.font;
      project.sections = updated.sections;

      const titleEl = document.getElementById('editor-project-title');
      if (titleEl) titleEl.innerText = project.name;
      saveProjectState();
      renderCanvasPreview();

      return appState.lang === 'ar' 
        ? "✨ تم تطبيق تعديلات الذكاء الاصطناعي بنجاح وتحديث التصميم!" 
        : "✨ AI modifications successfully applied and design updated!";
    } catch (e) {
      console.error("Failed to parse LLM response as JSON:", responseText, e);
      throw new Error(`Failed to apply AI changes: ${e.message}`);
    }
  }

  function extractJSON(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
    throw new Error("No JSON object found in response");
  }

  return html;
}
