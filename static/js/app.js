import { extractBatch, getBatchStatus, getProfile, updateProfile, generatePpt } from './api.js';

// --- ROUTER ---
function renderView(hash) {
  const app = document.getElementById('app');
  app.innerHTML = ''; // Clear current view
  
  if (hash === '' || hash === '#/') {
    app.appendChild(createLandingView());
  } else if (hash === '#/upload') {
    app.appendChild(createUploadView());
  } else if (hash.startsWith('#/processing/')) {
    const jobId = hash.split('/')[2];
    app.appendChild(createProcessingView(jobId));
  } else if (hash.startsWith('#/bioprofiles/')) {
    const id = hash.split('/')[2];
    app.appendChild(createBioProfileView(id));
  } else {
    app.appendChild(createLandingView());
  }
  
  // Re-initialize icons for new DOM elements
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

window.addEventListener('hashchange', () => renderView(window.location.hash));
renderView(window.location.hash);


// --- VIEWS ---

function createAppHeader(activeStep) {
  const getPillClass = (step) => step === activeStep ? 'active' : '';
  const getCircleClass = (step) => {
    if (step === activeStep) return 'active';
    if (step < activeStep) return 'completed';
    return '';
  };
  const getCircleContent = (step) => {
    if (step < activeStep) return '<i data-lucide="check" style="width:16px;height:16px;"></i>';
    return step;
  };

  return `
    <nav class="main-navbar">
      <div class="nav-brand">
        <div class="logo-placeholder"><i data-lucide="scan"></i></div>
        <div class="brand-text">SEGULA <br><span style="font-size:0.7rem; font-weight: 300;">TECHNOLOGIES</span></div>
      </div>
      <div class="nav-center-title">
        <span class="text-ai">AI</span> <span class="text-bio">BioProfile</span>
      </div>
      <div class="nav-links-right">
        <a href="#/" class="nav-item"><i data-lucide="home"></i> Accueil</a>
        <a href="/recent" class="nav-item"><i data-lucide="clock"></i> Profils récents</a>
        <a href="#/upload" class="btn-new-profile"><i data-lucide="plus"></i> Nouveau profil</a>
      </div>
    </nav>
    <div class="top-step-pills">
      <div class="step-pill ${getPillClass(1)}"><strong>1</strong> &middot; Upload</div>
      <div class="step-pill ${getPillClass(2)}"><strong>2</strong> &middot; Traitement</div>
      <div class="step-pill ${getPillClass(3)}"><strong>3</strong> &middot; BioProfile</div>
    </div>
    
    <div class="step-circles-container">
      <div class="step-circles">
        <div class="circle-item ${getCircleClass(1)}">
          <div class="circle">${getCircleContent(1)}</div>
          <span>Upload</span>
        </div>
        <div class="circle-line"></div>
        <div class="circle-item ${getCircleClass(2)}">
          <div class="circle">${getCircleContent(2)}</div>
          <span>Traitement IA</span>
        </div>
        <div class="circle-line"></div>
        <div class="circle-item ${getCircleClass(3)}">
          <div class="circle">${getCircleContent(3)}</div>
          <span>BioProfile</span>
        </div>
      </div>
    </div>
  `;
}

// 1. Landing View
function createLandingView() {
  const container = document.createElement('div');
  container.className = 'landing-container';
  container.innerHTML = `
    <nav class="landing-navbar">
      <div class="nav-logo">
        <div class="logo-circle"></div>
        <span class="brand-name">SEGULA <span class="brand-sub">Technologies</span></span>
      </div>
      <div class="nav-links">
        <a href="/recent" class="nav-link">Profils Récents</a>
        <a href="#/upload" class="btn-primary">Accéder à l'application</a>
      </div>
    </nav>
    <main>
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">
            L'Intelligence Artificielle au service de vos <span class="text-gradient">Profils Professionnels</span>
          </h1>
          <p class="hero-subtitle">
            Générez instantanément des biographies et des présentations PPTX de haute qualité à partir de n'importe quel CV. Smart profiles. Better matches.
          </p>
          <div class="hero-actions">
            <a href="#/upload" class="btn-primary-hero">
              Commencer maintenant <i data-lucide="chevron-right"></i>
            </a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="flow-diagram">
            <div class="flow-node"><i data-lucide="file-text"></i><span>CV (PDF/DOCX)</span></div>
            <div class="flow-arrow"><i data-lucide="chevron-right"></i></div>
            <div class="flow-node" style="border-color: var(--teal-500); color: var(--teal-500);"><i data-lucide="cpu"></i><span>IA Extraction</span></div>
            <div class="flow-arrow"><i data-lucide="chevron-right"></i></div>
            <div class="flow-node"><i data-lucide="presentation"></i><span>BioProfile PPTX</span></div>
          </div>
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2026 SEGULA Technologies. Tous droits réservés.</p>
        <p class="footer-sub">AI BioProfile Internal Tool</p>
      </div>
    </footer>
  `;
  return container;
}

// 2. Upload View
function createUploadView() {
  const container = document.createElement('div');
  container.className = 'upload-container';
  container.innerHTML = `
    ${createAppHeader(1)}
    
    <main class="upload-main">
      <div class="upload-step-label">ÉTAPE 1 SUR 3</div>
      <h1 class="upload-title">Importer un CV</h1>
      <p class="upload-subtitle">L'IA extrait automatiquement l'expérience, les compétences et la formation du candidat.</p>
      
      <div class="upload-card">
        <div class="dropzone" id="dropzone">
          <input type="file" id="fileInput" class="hidden" accept=".pdf,.docx,.txt" />
          
          <div id="dropContent" class="drop-content">
            <div class="upload-icon-wrapper">
              <i data-lucide="cloud-upload" class="upload-icon"></i>
            </div>
            <h3 class="drop-text-main">Glissez-déposez votre CV ici</h3>
            <p class="drop-text-sub">ou sélectionnez un fichier depuis votre ordinateur</p>
            <button class="btn-choose-file"><i data-lucide="folder-open"></i> Choisir un fichier</button>
            <div class="file-formats">
              <span class="format-badge">PDF</span>
              <span class="format-badge">DOCX</span>
              <span class="format-badge">TXT</span>
              <span class="format-size">- 10 Mo max</span>
            </div>
          </div>
          
        </div>

        <div id="fileSelected" class="file-selected hidden">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <i data-lucide="file-text" class="file-icon" style="color: var(--teal-500);"></i>
            <div class="file-info">
              <p class="file-name" id="fileName"></p>
              <p class="file-size" id="fileSize"></p>
            </div>
          </div>
          <i data-lucide="check-circle-2" class="file-check-icon"></i>
        </div>
        
        <div id="errorAlert" class="error-alert hidden">
          <i data-lucide="alert-circle"></i>
          <span id="errorMsg"></span>
        </div>
        
        <div class="upload-actions">
          <button class="btn-extract" id="submitBtn" disabled>
            <i data-lucide="wand-2"></i> Extraire les informations
          </button>
        </div>

        <div class="trust-indicators">
          <div class="trust-item">
            <i data-lucide="shield-check"></i> Traitement sécurisé
          </div>
          <div class="trust-item">
            <i data-lucide="lock"></i> Données confidentielles
          </div>
          <div class="trust-item">
            <i data-lucide="user-check"></i> Validation humaine requise
          </div>
        </div>
      </div>
    </main>
  `;
  
  const dropzone = container.querySelector('#dropzone');
  const fileInput = container.querySelector('#fileInput');
  const dropContent = container.querySelector('#dropContent');
  const fileSelected = container.querySelector('#fileSelected');
  const fileName = container.querySelector('#fileName');
  const fileSize = container.querySelector('#fileSize');
  const removeBtn = container.querySelector('#removeBtn');
  const errorAlert = container.querySelector('#errorAlert');
  const errorMsg = container.querySelector('#errorMsg');
  const submitBtn = container.querySelector('#submitBtn');
  
  let currentFile = null;
  
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  
  function validateFile(f) {
    if (!validTypes.includes(f.type)) {
      errorMsg.textContent = "Veuillez uploader un fichier PDF, DOCX ou TXT.";
      errorAlert.classList.remove('hidden');
      return false;
    }
    errorAlert.classList.add('hidden');
    return true;
  }
  
  function setFile(f) {
    currentFile = f;
    dropContent.classList.add('hidden');
    fileSelected.classList.remove('hidden');
    fileName.textContent = f.name;
    fileSize.textContent = (f.size / 1024 / 1024).toFixed(2) + " MB";
    submitBtn.disabled = false;
  }
  
  dropzone.addEventListener('click', (e) => {
    // Only open file input if the click isn't on a remove button (which we removed, but just in case)
    if(e.target.closest('button')) return;
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f && validateFile(f)) setFile(f);
  });
  
  // Re-enable clicking dropzone to select another file even when one is selected
  fileSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
  });
  
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragging'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  });
  
  submitBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'En cours...';
    try {
      const data = await extractBatch(currentFile);
      window.location.hash = '#/processing/' + data.job_id;
    } catch (err) {
      errorMsg.textContent = "Une erreur s'est produite lors de la connexion au serveur.";
      errorAlert.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Extraire les informations';
    }
  });
  
  return container;
}

// 3. Processing View
function createProcessingView(jobId) {
  const container = document.createElement('div');
  container.className = 'processing-container';
  container.innerHTML = `
    ${createAppHeader(2)}
    <main class="upload-main">
      <div class="upload-step-label">ÉTAPE 2 SUR 3</div>
      <h1 class="upload-title" id="procTitle">Analyse du CV en cours</h1>
      <p class="upload-subtitle" id="procSubtitle">Cela prend généralement moins de 30 secondes.</p>
      
      <div class="processing-card">
        <div class="spinner-container">
          <div class="circular-spinner"></div>
        </div>
        
        <ul class="processing-steps-list">
          <li class="proc-step completed">
            <div class="proc-step-icon"><i data-lucide="check"></i></div>
            <span>Document traité</span>
          </li>
          <li class="proc-step completed">
            <div class="proc-step-icon"><i data-lucide="check"></i></div>
            <span>Contenu extrait</span>
          </li>
          <li class="proc-step active">
            <div class="proc-step-icon"><div class="dot"></div></div>
            <span class="active-text">Identification de l'expérience</span>
          </li>
          <li class="proc-step pending">
            <div class="proc-step-icon"></div>
            <span>Construction du BioProfile</span>
          </li>
          <li class="proc-step pending">
            <div class="proc-step-icon"></div>
            <span>Validation finale</span>
          </li>
        </ul>
        
        <div id="procError" class="error-alert hidden" style="margin-top: 1.5rem;">
          Impossible de récupérer l'état du traitement.
        </div>
        
        <button class="btn-primary hidden" id="procRetry" onclick="window.location.hash='#/upload'" style="margin-top: 1.5rem; width: 100%;">Réessayer</button>
      </div>
    </main>
  `;
  
  const pollInterval = setInterval(async () => {
    try {
      const statusData = await getBatchStatus(jobId);
      const keys = Object.keys(statusData.files);
      if (keys.length > 0) {
        const fileKey = keys[0];
        const fileStatus = statusData.files[fileKey];
        
        container.querySelector('#procSubtitle').innerHTML = `<span class="file-name">${fileKey}</span>`;
        container.querySelector('#procMsg').textContent = fileStatus.message || 'En attente...';
        
        if (fileStatus.status === 'done' && fileStatus.result) {
          clearInterval(pollInterval);
          container.querySelector('.spinner-container').innerHTML = '<i data-lucide="check-circle-2" class="icon-success" style="width:64px;height:64px"></i>';
          container.querySelector('#procTitle').textContent = 'Analyse Terminée';
          container.querySelector('#procSubtitle').textContent = 'Redirection vers votre BioProfile...';
          
          // Mark all steps as completed
          const steps = container.querySelectorAll('.proc-step');
          steps.forEach(step => {
            step.className = 'proc-step completed';
            step.querySelector('.proc-step-icon').innerHTML = '<i data-lucide="check"></i>';
            const span = step.querySelector('span');
            span.className = '';
          });
          
          if (window.lucide) window.lucide.createIcons();
          
          setTimeout(() => {
            const profileFilename = fileStatus.result.replace('profiles/', '');
            window.location.hash = '#/bioprofiles/' + profileFilename;
          }, 1500);
        } else if (fileStatus.status === 'error') {
          clearInterval(pollInterval);
          container.querySelector('.spinner-container').innerHTML = '<i data-lucide="alert-circle" class="icon-error" style="width:64px;height:64px"></i>';
          container.querySelector('#procTitle').textContent = 'Erreur de Traitement';
          container.querySelector('#procError').textContent = fileStatus.message || "Une erreur s'est produite";
          container.querySelector('#procError').classList.remove('hidden');
          container.querySelector('#procRetry').classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
      }
    } catch (err) {
      clearInterval(pollInterval);
      container.querySelector('#procError').classList.remove('hidden');
      container.querySelector('#procRetry').classList.remove('hidden');
    }
  }, 2000);
// 4. BioProfile View
function createBioProfileView(id) {
  const container = document.createElement('div');
  container.className = 'profile-container';
  container.innerHTML = `
    ${createAppHeader(3)}
    <main class="profile-main">
      <div class="profile-actions-bar">
        <button class="btn-secondary" onclick="window.location.href='/recent'">
          <i data-lucide="arrow-left"></i> Retour
        </button>
        <div class="action-right">
          <span id="saveStatus" style="color:var(--teal-500);font-size:0.875rem;margin-right:1rem;" class="hidden"><i data-lucide="refresh-cw" class="icon-spin"></i> Sauvegarde...</span>
          <select id="templateSelect" class="template-select">
            <option value="BioProfile_OFF.pptx">Modèle Standard (BioProfile_OFF)</option>
            <option value="BioProfile_Generated.pptx">Modèle Généré (BioProfile_Generated)</option>
          </select>
          <button class="btn-primary" id="exportBtn">
             Générer PPT
          </button>
        </div>
      </div>
      
      <div id="profileContent" style="display:flex; flex-direction:column; gap:1.5rem; width:100%;">
        <div style="padding:4rem; text-align:center;"><i data-lucide="loader-2" class="icon-spin" style="width:48px;height:48px;color:var(--teal-500);"></i></div>
      </div>
    </main>
  `;
  
  let profile = null;

  async function loadProfile() {
    try {
      profile = await getProfile(id);
      renderProfile();
    } catch (err) {
      container.querySelector('#profileContent').innerHTML = '<div style="color:red;padding:2rem;text-align:center;">Erreur: Profil introuvable</div>';
    }
  }

  async function handleSave(field, val) {
    if (!profile) return;
    const updated = { ...profile, [field]: val };
    profile = updated; // optimistic update
    renderProfile();
    
    const saveStatus = container.querySelector('#saveStatus');
    saveStatus.classList.remove('hidden');
    try {
      await updateProfile(id, updated);
      saveStatus.classList.add('hidden');
    } catch(e) {
      alert("Erreur de sauvegarde");
      saveStatus.classList.add('hidden');
    }
  }

  function renderInlineEdit(value, field, multiline=false, placeholder="Non renseigné", customClass="") {
    const div = document.createElement('div');
    div.className = 'inline-editable ' + customClass;
    
    const viewDiv = document.createElement('div');
    viewDiv.className = 'inline-view';
    viewDiv.innerHTML = value ? value.replace(/\\n/g, '<br/>') : `<span style="color:var(--text-muted);font-style:italic">${placeholder}</span>`;
    
    const editDiv = document.createElement('div');
    editDiv.className = 'inline-edit hidden';
    
    let input;
    if (multiline) {
      input = document.createElement('textarea');
      input.className = 'field-textarea';
      input.value = value || '';
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'field-input';
      input.value = value || '';
    }
    editDiv.appendChild(input);
    
    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn-small btn-cancel';
    btnCancel.textContent = 'Annuler';
    const btnSave = document.createElement('button');
    btnSave.className = 'btn-small btn-save';
    btnSave.textContent = 'Sauvegarder';
    actions.appendChild(btnCancel);
    actions.appendChild(btnSave);
    editDiv.appendChild(actions);
    
    viewDiv.addEventListener('click', () => {
      viewDiv.classList.add('hidden');
      editDiv.classList.remove('hidden');
      input.focus();
    });
    
    btnCancel.addEventListener('click', () => {
      input.value = value || '';
      editDiv.classList.add('hidden');
      viewDiv.classList.remove('hidden');
    });
    
    btnSave.addEventListener('click', () => {
      handleSave(field, input.value);
    });
    
    div.appendChild(viewDiv);
    div.appendChild(editDiv);
    return div;
  }
  
  function renderExperienceItem(exp, index) {
    const div = document.createElement('div');
    div.className = 'exp-item drag-item';
    
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = "1";
    
    // Header (Title + delete btn)
    const headerDiv = document.createElement('div');
    headerDiv.className = 'exp-item-header';
    
    const titleEdit = renderInlineEdit(exp.titre, null, false, "Titre du poste", "exp-title-edit");
    const titleSaveBtn = titleEdit.querySelector('.btn-save');
    const titleInput = titleEdit.querySelector('.field-input');
    titleSaveBtn.onclick = null;
    titleSaveBtn.addEventListener('click', () => {
      const arr = [...profile.projets_et_experiences];
      arr[index].titre = titleInput.value;
      handleSave('projets_et_experiences', arr);
    });
    
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    delBtn.addEventListener('click', () => {
      if (confirm('Supprimer cette expérience ?')) {
        const arr = profile.projets_et_experiences.filter((_, i) => i !== index);
        handleSave('projets_et_experiences', arr);
      }
    });
    
    headerDiv.appendChild(titleEdit);
    headerDiv.appendChild(delBtn);
    
    // Subtitle (Dates, company) - simple text for now, or extracted from title
    const metaDiv = document.createElement('div');
    metaDiv.className = 'exp-meta';
    // We could extract company/dates from title if needed, or just let them edit description
    
    // Description
    const descEdit = renderInlineEdit(exp.description, null, true, "Description de l'expérience", "exp-desc-edit");
    const descSaveBtn = descEdit.querySelector('.btn-save');
    const descInput = descEdit.querySelector('.field-textarea');
    descSaveBtn.onclick = null;
    descSaveBtn.addEventListener('click', () => {
      const arr = [...profile.projets_et_experiences];
      arr[index].description = descInput.value;
      handleSave('projets_et_experiences', arr);
    });
    
    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(metaDiv);
    contentDiv.appendChild(descEdit);
    
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.draggable = true;
    handle.innerHTML = '<i data-lucide="grip-vertical"></i>';
    
    div.appendChild(handle);
    div.appendChild(contentDiv);
    
    // Drag drop implementation
    handle.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      div.style.opacity = '0.5';
    });
    handle.addEventListener('dragend', () => {
      div.style.opacity = '1';
    });
    div.addEventListener('dragover', (e) => e.preventDefault());
    div.addEventListener('drop', (e) => {
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
      if (dragIndex !== index) {
        const arr = [...profile.projets_et_experiences];
        const [moved] = arr.splice(dragIndex, 1);
        arr.splice(index, 0, moved);
        handleSave('projets_et_experiences', arr);
      }
    });
    
    return div;
  }

  function renderProfile() {
    if (!profile) return;
    
    let filledFields = 0;
    const totalFields = 6;
    if (profile.nom_complet) filledFields++;
    if (profile.titre_professionnel) filledFields++;
    if (profile.autres_informations) filledFields++;
    if (profile.projets_et_experiences && profile.projets_et_experiences.length > 0) filledFields++;
    if (profile.hard_skills && profile.hard_skills.length > 0) filledFields++;
    if (profile.soft_skills && profile.soft_skills.length > 0) filledFields++;
    const completeness = Math.round((filledFields / totalFields) * 100);
    
    const initials = profile.nom_complet ? profile.nom_complet.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
    
    const missingInfoText = (profile.missing_fields && profile.missing_fields.length > 0) ? profile.missing_fields.length + " informations manquantes" : "Profil complet";

    const contentDiv = container.querySelector('#profileContent');
    contentDiv.innerHTML = `
      <!-- Hero Card -->
      <div class="profile-hero-card">
        <div class="hero-avatar">${initials}</div>
        <div class="hero-info">
          <div id="nameContainer" style="font-size: 1.25rem; font-weight: 700; color: white;"></div>
          <div id="titleContainer" style="color: var(--teal-500); font-weight: 500; margin-bottom: 0.5rem;"></div>
          <div class="hero-meta">
            <span><i data-lucide="map-pin"></i> Casablanca, Maroc</span>
            <span id="availContainer"></span>
          </div>
        </div>
        <div class="hero-status">
          <span class="status-label">Statut</span>
          <span class="status-badge">Disponible</span>
        </div>
      </div>

      <!-- Completeness Card -->
      <div class="profile-completeness-card">
        <span class="comp-label">Complétude du profil</span>
        <div class="comp-bar-container"><div class="comp-bar-fill" style="width:${completeness}%"></div></div>
        <span class="comp-percent">${completeness}%</span>
        ${profile.missing_fields && profile.missing_fields.length > 0 
          ? \`<span class="comp-warning"><i data-lucide="alert-triangle"></i> \${missingInfoText}</span>\`
          : \`<span class="comp-success"><i data-lucide="check-circle-2"></i> \${missingInfoText}</span>\`}
      </div>

      <!-- Main Grid -->
      <div class="bio-grid">
        <div class="bio-column-left">
          
          <div class="bio-card">
            <div class="bio-card-header">
              <i data-lucide="user"></i> Résumé professionnel
            </div>
            <div class="bio-card-body" id="summaryContainer"></div>
          </div>

          <div class="bio-card">
            <div class="bio-card-header">
              <div style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="briefcase"></i> Expérience</div>
              <button class="btn-icon" id="addExpBtn"><i data-lucide="plus"></i></button>
            </div>
            <div class="bio-card-body" id="expListContainer"></div>
          </div>
          
          <div class="bio-card">
            <div class="bio-card-header">
              <i data-lucide="graduation-cap"></i> Formation
            </div>
            <div class="bio-card-body" id="eduContainer">
              <div style="color:var(--text-muted);font-style:italic;">Édition des formations non supportée dans cette version de l'API.</div>
            </div>
          </div>

        </div>
        
        <div class="bio-column-right">
          
          <div class="bio-card">
            <div class="bio-card-header">
              <i data-lucide="code"></i> Compétences
            </div>
            <div class="bio-card-body">
              <div class="skills-container">
                ${(profile.hard_skills || []).map(s => \`<span class="skill-badge">\${s}</span>\`).join('')}
                ${(profile.soft_skills || []).map(s => \`<span class="skill-badge soft">\${s}</span>\`).join('')}
              </div>
            </div>
          </div>

          <div class="bio-card">
            <div class="bio-card-header">
              <i data-lucide="languages"></i> Langues
            </div>
            <div class="bio-card-body">
              <div class="skills-container">
                 <span class="skill-badge outline">Français - Natif</span>
                 <span class="skill-badge outline">Anglais - C1</span>
              </div>
            </div>
          </div>
          
          ${profile.missing_fields && profile.missing_fields.length > 0 ? `
          <div class="bio-card warning-card">
            <div class="bio-card-header warning">
              <i data-lucide="alert-triangle"></i> Informations manquantes
            </div>
            <div class="bio-card-body">
              <ul class="missing-list-simple">
                ${profile.missing_fields.map(m => `<li>- ${m}</li>`).join('')}
              </ul>
            </div>
          </div>
          ` : ''}

        </div>
      </div>
    `;

    // Inject editable fields
    contentDiv.querySelector('#nameContainer').appendChild(renderInlineEdit(profile.nom_complet, 'nom_complet', false, "Nom Complet"));
    contentDiv.querySelector('#titleContainer').appendChild(renderInlineEdit(profile.titre_professionnel, 'titre_professionnel', false, "Titre Professionnel"));
    contentDiv.querySelector('#availContainer').appendChild(renderInlineEdit(profile.disponibilite, 'disponibilite', false, "Disponibilité"));
    
    contentDiv.querySelector('#summaryContainer').appendChild(renderInlineEdit(profile.autres_informations, 'autres_informations', true, "Résumé du profil..."));
    
    const expListContainer = contentDiv.querySelector('#expListContainer');
    if (profile.projets_et_experiences) {
      profile.projets_et_experiences.forEach((exp, idx) => {
        expListContainer.appendChild(renderExperienceItem(exp, idx));
      });
    }
    
    contentDiv.querySelector('#addExpBtn').onclick = () => {
      const arr = [{titre: 'Nouvelle Expérience', description: ''}, ...(profile.projets_et_experiences || [])];
      handleSave('projets_et_experiences', arr);
    };

    if (window.lucide) window.lucide.createIcons();
  }
  
  loadProfile();
  
  container.querySelector('#exportBtn').addEventListener('click', async () => {
    if (!profile) return;
    try {
      const exportBtn = container.querySelector('#exportBtn');
      exportBtn.disabled = true;
      exportBtn.textContent = "Génération...";
      
      const templateSelect = container.querySelector('#templateSelect');
      const selectedTemplate = templateSelect.value;
      
      const payload = { ...profile, template: selectedTemplate };
      
      const blob = await generatePpt(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`BioProfile_\${profile.nom_complet ? profile.nom_complet.replace(/\\s+/g, '_') : 'Generated'}.pptx\`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      exportBtn.disabled = false;
      exportBtn.innerHTML = "Générer PPT";
    } catch(e) {
      alert("Erreur lors de la génération du PPT.");
      const exportBtn = container.querySelector('#exportBtn');
      exportBtn.disabled = false;
      exportBtn.innerHTML = "Générer PPT";
    }
  });
  
  return container;
}
