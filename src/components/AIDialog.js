// AIDialog.js
import { generateSiteFromPrompt } from '../utils/generator.js';
import { storage } from '../utils/storage.js';

export function openAIDialog(appState, initialPrompt, onGenerated) {
  const trans = appState.translations;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ai-dialog-modal';

  const defaultPrompt = initialPrompt || '';
  
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 650px;">
      <div class="modal-header">
        <h3 class="modal-title">✨ ${trans.aiModalTitle}</h3>
        <button class="modal-close-btn" id="ai-modal-close">&times;</button>
      </div>
      <div class="modal-body" id="ai-modal-body">
        <form id="ai-generation-form" style="display: flex; flex-direction: column; gap: 16px;">
          
          <div class="input-group">
            <label class="input-label" for="ai-prompt-area">${trans.aiPromptLabel}</label>
            <textarea class="input-field" id="ai-prompt-area" rows="4" required style="resize: none; font-size: 1rem;" placeholder="${trans.promptPlaceholder}">${defaultPrompt}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="input-group">
              <label class="input-label" for="ai-category">${trans.aiCategoryLabel}</label>
              <select class="input-field" id="ai-category">
                <option value="auto">🔍 Auto-detect</option>
                <option value="restaurant">${trans.aiCatRestaurant}</option>
                <option value="portfolio">${trans.aiCatPortfolio}</option>
                <option value="business">${trans.aiCatBusiness}</option>
                <option value="saas">${trans.aiCatSaaS}</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label" for="ai-color">${trans.aiColorLabel}</label>
              <select class="input-field" id="ai-color">
                <option value="auto">🎨 Auto-detect</option>
                <option value="theme-sunset">${trans.aiColorSunset}</option>
                <option value="theme-emerald">${trans.aiColorEmerald}</option>
                <option value="theme-midnight">${trans.aiColorMidnight}</option>
                <option value="theme-corporate">${trans.aiColorCorporate}</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="ai-tone">${trans.aiToneLabel}</label>
            <select class="input-field" id="ai-tone">
              <option value="professional">${trans.aiToneProfessional}</option>
              <option value="creative" selected>${trans.aiToneCreative}</option>
              <option value="friendly">${trans.aiToneFriendly}</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 10px; width: 100%; font-size: 1.1rem; padding: 12px;">
            ${trans.aiBtnGenerate}
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event handlers
  const closeBtn = document.getElementById('ai-modal-close');
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });

  const form = document.getElementById('ai-generation-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = document.getElementById('ai-prompt-area').value;
    const category = document.getElementById('ai-category').value;
    const theme = document.getElementById('ai-color').value;
    const tone = document.getElementById('ai-tone').value;

    startGenerationProcess(appState, prompt, { category, theme, tone }, onGenerated, overlay);
  });
}

function showGenerationError(modalBody, message, closeBtn, trans) {
  if (closeBtn) {
    closeBtn.style.display = 'block';
  }

  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 10px; gap: 22px; text-align: center;">
      <div style="font-size: 3rem;">⚠️</div>
      <h3 style="margin: 0; color: var(--text-danger);">${trans.aiErrorTitle || 'حدث خطأ'}</h3>
      <p style="max-width: 420px; color: var(--text-secondary);">${message}</p>
      <button class="btn btn-primary" id="ai-generation-error-close">${trans.cancel || 'Close'}</button>
    </div>
  `;

  const errorCloseBtn = document.getElementById('ai-generation-error-close');
  if (errorCloseBtn) {
    errorCloseBtn.addEventListener('click', () => {
      document.getElementById('ai-dialog-modal')?.remove();
    });
  }
}

function startGenerationProcess(appState, prompt, config, onGenerated, modalOverlay) {
  const trans = appState.translations;
  const modalBody = document.getElementById('ai-modal-body');
  
  // Clear modal header close button during generation to prevent interruption
  const closeBtn = document.getElementById('ai-modal-close');
  if (closeBtn) closeBtn.style.display = 'none';

  // Render generator steps loading screen
  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 10px; gap: 24px;">
      <div class="spinner" style="width: 50px; height: 50px; border-width: 5px;"></div>
      
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 400px;" id="generator-steps-box">
        <div class="gen-step" id="step-1" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${trans.aiGeneratingStep1}</span>
        </div>
        <div class="gen-step" id="step-2" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${trans.aiGeneratingStep2}</span>
        </div>
        <div class="gen-step" id="step-3" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${trans.aiGeneratingStep3}</span>
        </div>
        <div class="gen-step" id="step-4" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${trans.aiGeneratingStep4}</span>
        </div>
      </div>
    </div>
  `;

  const steps = [
    { id: 'step-1', duration: 1200 },
    { id: 'step-2', duration: 1200 },
    { id: 'step-3', duration: 1000 },
    { id: 'step-4', duration: 1000 }
  ];

  let currentStepIdx = 0;
  let finished = false;

  const fallbackTimeout = setTimeout(() => {
    if (!finished) {
      showGenerationError(
        modalBody,
        trans.aiErrorMessage || (appState.lang === 'ar' ? 'تعذر إكمال التوليد في الوقت المحدد. حاول مرة أخرى.' : 'Unable to complete generation in time. Please try again.'),
        closeBtn,
        trans
      );
    }
  }, 15000);

  function finalizeGeneration(newProject) {
    if (finished) return;
    finished = true;
    clearTimeout(fallbackTimeout);
    modalOverlay.remove();
    onGenerated(newProject);
  }

  function failGeneration(message) {
    if (finished) return;
    finished = true;
    clearTimeout(fallbackTimeout);
    showGenerationError(modalBody, message, closeBtn, trans);
  }

  function runNextStep() {
    if (currentStepIdx < steps.length) {
      const step = steps[currentStepIdx];
      const stepEl = document.getElementById(step.id);
      if (!stepEl) {
        failGeneration(trans.aiErrorMessage || (appState.lang === 'ar' ? 'حدث خطأ أثناء التحميل. الرجاء إعادة المحاولة.' : 'An error occurred during generation. Please try again.'));
        return;
      }

      // Update previous steps to checkmark
      if (currentStepIdx > 0) {
        const prevStep = document.getElementById(steps[currentStepIdx - 1].id);
        if (prevStep) {
          const prevBullet = prevStep.querySelector('.step-bullet');
          if (prevBullet) prevBullet.innerHTML = '✅';
          prevStep.style.opacity = '0.9';
          prevStep.style.color = '#10b981';
        }
      }

      // Highlight active step
      stepEl.style.opacity = '1';
      const activeBullet = stepEl.querySelector('.step-bullet');
      if (activeBullet) activeBullet.innerHTML = '⚡';
      stepEl.style.fontWeight = 'bold';

      setTimeout(() => {
        currentStepIdx++;
        runNextStep();
      }, step.duration);
    } else {
      const lastStep = document.getElementById(steps[steps.length - 1].id);
      if (lastStep) {
        const lastBullet = lastStep.querySelector('.step-bullet');
        if (lastBullet) lastBullet.innerHTML = '✅';
        lastStep.style.opacity = '0.9';
        lastStep.style.color = '#10b981';
      }

      setTimeout(() => {
        try {
          const siteData = generateSiteFromPrompt(prompt, {
            language: appState.lang,
            category: config.category,
            theme: config.theme,
            tone: config.tone
          });

          const newProject = storage.createProject(
            siteData.name,
            siteData.description,
            siteData.theme,
            siteData.font,
            siteData.language,
            siteData.sections
          );

          finalizeGeneration(newProject);
        } catch (err) {
          console.error('AI generation failed', err);
          const detailMsg = trans.aiErrorMessage 
            ? `${trans.aiErrorMessage} (${err.message})`
            : (appState.lang === 'ar' ? `تعذر إكمال توليد الموقع: ${err.message}` : `Site generation failed: ${err.message}`);
          failGeneration(detailMsg);
        }
      }, 500);
    }
  }

  // Start sequence
  runNextStep();
}
