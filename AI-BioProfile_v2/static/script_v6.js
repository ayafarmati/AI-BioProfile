document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extract-btn');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    const uploadSection = document.getElementById('upload-section');
    const batchDashboard = document.getElementById('batch-dashboard');
    const batchFilesList = document.getElementById('batch-files-list');
    
    const validationModal = document.getElementById('validation-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const profileForm = document.getElementById('profile-form');
    const generatePptBtn = document.getElementById('generate-btn');
    
    const loadingState = document.getElementById('loading-state');
    const validationSection = document.getElementById('validation-section');

    let batchPollInterval = null;
    let batchStartTime = null;
    let currentEditingFilename = null;

    // --- Restore active batch job if exists ---
    const activeJobId = localStorage.getItem('active_batch_job');
    if (activeJobId) {
        startPolling(activeJobId);
    }

    // Auto-load profile if URL param action=edit & file=...
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'edit') {
        const fileToEdit = urlParams.get('file');
        if (fileToEdit) {
            // Give it a tiny delay to ensure DOM is fully ready
            setTimeout(() => {
                window.openValidation(fileToEdit);
            }, 100);
        }
    }

    // --- Click to select file ---
    if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                fileInput.click();
            }
        });

        // --- Drag and Drop ---
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                updateFileDisplay();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', updateFileDisplay);
    }

    function updateFileDisplay() {
        if (fileInput.files.length === 1) {
            fileNameDisplay.textContent = `Fichier sélectionné : ${fileInput.files[0].name}`;
        } else if (fileInput.files.length > 1) {
            fileNameDisplay.textContent = `${fileInput.files.length} fichiers sélectionnés`;
        } else {
            fileNameDisplay.textContent = '';
        }
    }

    if (extractBtn) {
        extractBtn.addEventListener('click', async () => {
            const files = fileInput.files;

            if (files.length === 0) {
                showToast('Veuillez sélectionner au moins un fichier PDF, DOCX ou TXT.', 'error');
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            
            // Disable button
            extractBtn.disabled = true;
            extractBtn.innerHTML = 'Envoi en cours...';

            try {
                const response = await fetch('/api/extract-batch', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error("Erreur serveur lors de l'envoi du lot");
                const data = await response.json();
                
                // Save to local storage
                localStorage.setItem('active_batch_job', data.job_id);
                
                // Start polling
                startPolling(data.job_id);
                
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                extractBtn.disabled = false;
                extractBtn.innerHTML = `<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Extraire les informations`;
            }
        });
    }

    function startPolling(jobId) {
        if (uploadSection) uploadSection.classList.add('hidden');
        if (batchDashboard) batchDashboard.classList.remove('hidden');
        
        batchStartTime = Date.now();
        const etaElement = document.getElementById('batch-eta');
        if (etaElement) etaElement.textContent = 'Calcul du temps restant...';
        
        if (batchPollInterval) clearInterval(batchPollInterval);
        
        // Initial fetch
        pollBatchStatus(jobId);
        
        // Setup interval
        batchPollInterval = setInterval(() => pollBatchStatus(jobId), 3000);
    }

    async function pollBatchStatus(jobId) {
        try {
            const res = await fetch(`/api/batch-status/${jobId}`);
            if (res.status === 404) {
                // Job not found or expired, clear it
                localStorage.removeItem('active_batch_job');
                if (batchPollInterval) clearInterval(batchPollInterval);
                if (uploadSection) uploadSection.classList.remove('hidden');
                if (batchDashboard) batchDashboard.classList.add('hidden');
                return;
            }
            
            if (!res.ok) throw new Error("Erreur de statut batch");
            const data = await res.json();
            
            if (batchFilesList) batchFilesList.innerHTML = '';
            
            let allDone = true;
            let totalFiles = 0;
            let completedFiles = 0;
            
            for (const [filename, info] of Object.entries(data.files)) {
                totalFiles++;
                if (info.status === 'done' || info.status === 'error') {
                    completedFiles++;
                } else {
                    allDone = false;
                }
                
                const card = document.createElement('div');
                card.className = 'batch-file-card';
                if (info.status === 'done') card.classList.add('done');
                if (info.status === 'error') card.classList.add('error');
                
                let iconHtml = '<div class="spinner">🔄</div>';
                if (info.status === 'done') iconHtml = '✅';
                if (info.status === 'error') iconHtml = '❌';
                
                let actionBtnHtml = '';
                if (info.status === 'done') {
                    let jsonName = '';
                    if (info.result) {
                        const parts = info.result.split(/[\/\\]/);
                        jsonName = parts[parts.length - 1];
                    } else {
                        jsonName = filename.replace(/\.(pdf|docx|txt)$/i, '') + '.json';
                    }
                    actionBtnHtml = `<button class="primary-btn" style="padding: 0.5rem 1rem; width: auto; font-size: 0.9rem;" onclick="window.openValidation('${jsonName}')">Vérifier & Générer PPT</button>`;
                }
                
                card.innerHTML = `
                    <div class="batch-file-info">
                        <div class="batch-file-name">${filename}</div>
                        <div class="batch-file-status">
                            ${iconHtml} ${info.message}
                        </div>
                    </div>
                    <div>
                        ${actionBtnHtml}
                    </div>
                `;
                if (batchFilesList) batchFilesList.appendChild(card);
            }
            
            // --- LOGIQUE ETA ---
            const etaElement = document.getElementById('batch-eta');
            if (etaElement) {
                if (allDone || data.status === 'done') {
                    etaElement.textContent = 'Terminé';
                } else if (completedFiles > 0 && totalFiles > 0) {
                    const elapsedMs = Date.now() - batchStartTime;
                    const msPerFile = elapsedMs / completedFiles;
                    const remainingFiles = totalFiles - completedFiles;
                    const etaMs = msPerFile * remainingFiles;
                    
                    const etaMinutes = Math.floor(etaMs / 60000);
                    const etaSeconds = Math.floor((etaMs % 60000) / 1000);
                    
                    if (etaMinutes > 0) {
                        etaElement.textContent = `~ ${etaMinutes} min ${etaSeconds} sec restantes`;
                    } else {
                        etaElement.textContent = `~ ${etaSeconds} sec restantes`;
                    }
                } else {
                    etaElement.textContent = 'Calcul du temps restant...';
                }
            }
            
            if (data.status === 'done' || allDone) {
                if (batchPollInterval) clearInterval(batchPollInterval);
                localStorage.removeItem('active_batch_job');
                
                // Add a "Retour à l'import" button at the bottom of the list
                const resetBtn = document.createElement('button');
                resetBtn.className = 'primary-btn';
                resetBtn.style.marginTop = '2rem';
                resetBtn.textContent = 'Importer d\'autres CV';
                resetBtn.onclick = () => {
                    batchDashboard.classList.add('hidden');
                    uploadSection.classList.remove('hidden');
                    fileInput.value = '';
                    fileNameDisplay.textContent = '';
                };
                if (batchFilesList) batchFilesList.appendChild(resetBtn);
            }
            
        } catch (error) {
            console.error(error);
        }
    }

    // --- Validation Modal Logic ---
    window.openValidation = async function(jsonFilename) {
        currentEditingFilename = jsonFilename;
        validationModal.classList.remove('hidden');
        loadingState.classList.remove('hidden');
        validationSection.classList.add('hidden');
        
        try {
            const response = await fetch(`/api/profiles/${encodeURIComponent(jsonFilename)}`);
            if (!response.ok) throw new Error("Erreur de chargement du profil");
            
            const data = await response.json();
            
            // Handle PDF Viewer
            const pdfContainer = document.getElementById('pdf-container');
            const pdfViewer = document.getElementById('pdf-viewer');
            if (data.pdf_path && data.pdf_path !== '') {
                pdfViewer.src = data.pdf_path;
                pdfContainer.classList.remove('hidden');
            } else {
                pdfViewer.src = '';
                pdfContainer.classList.add('hidden');
            }
            
            buildForm(data);
            
            loadingState.classList.add('hidden');
            validationSection.classList.remove('hidden');
        } catch (error) {
            showToast(error.message, 'error');
            validationModal.classList.add('hidden');
        }
    };

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            validationModal.classList.add('hidden');
            currentEditingFilename = null;
        });
    }

    if (generatePptBtn) {
        generatePptBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent native form submission
            const formData = gatherFormData();
            
            if (!formData.nom_complet) {
                showToast('Le nom complet est obligatoire.', 'error');
                return;
            }
            
            if (currentEditingFilename) {
                formData.filename = currentEditingFilename;
            }
            
            const selectedTemplate = localStorage.getItem('selected_template') || 'BioProfile_OFF.pptx';
            formData.template = selectedTemplate;

            generatePptBtn.disabled = true;
            const originalText = generatePptBtn.innerHTML;
            generatePptBtn.innerHTML = 'Génération en cours...';

            try {
                const response = await fetch('/api/generate-ppt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) throw new Error('Erreur de génération du PPT');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Show success modal
                validationModal.classList.add('hidden');
                const successModal = document.getElementById('success-modal');
                const downloadLink = document.getElementById('download-link');
                
                downloadLink.href = url;
                downloadLink.download = `BioProfile_${formData.nom_complet.replace(/\s+/g, '_')}.pptx`;
                
                successModal.classList.remove('hidden');
                
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                generatePptBtn.disabled = false;
                generatePptBtn.innerHTML = originalText;
            }
        });
    }

    // --- Form Builder Logic (Kept from original) ---
    function buildForm(data) {
        profileForm.innerHTML = '';
        if (data.photo_path === undefined) data.photo_path = "";
        if (!data.titre_professionnel && !data.professional_title) data.titre_professionnel = "";

        function renderValue(key, value, parent) {
            if (key === 'photo_path') {
                const group = document.createElement('div');
                group.className = 'form-group';
                group.dataset.key = 'photo_path';
                
                const label = document.createElement('label');
                label.textContent = 'Photo de Profil';
                group.appendChild(label);
                
                const photoWrapper = document.createElement('div');
                photoWrapper.style.display = 'flex';
                photoWrapper.style.alignItems = 'center';
                photoWrapper.style.gap = '20px';
                photoWrapper.style.background = 'rgba(0, 0, 0, 0.05)';
                photoWrapper.style.padding = '15px';
                photoWrapper.style.borderRadius = '12px';
                
                const img = document.createElement('img');
                img.id = 'profile-preview-img';
                img.style.width = '80px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid var(--brand-blue)';
                img.src = value || 'https://via.placeholder.com/150x180?text=Pas+de+Photo';
                photoWrapper.appendChild(img);
                
                const uploadContainer = document.createElement('div');
                uploadContainer.style.display = 'flex';
                uploadContainer.style.flexDirection = 'column';
                uploadContainer.style.gap = '8px';
                
                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'primary-btn';
                uploadBtn.textContent = 'Changer la photo';
                uploadBtn.style.padding = '8px 16px';
                uploadBtn.style.fontSize = '0.9rem';
                uploadBtn.style.width = 'auto';
                uploadContainer.appendChild(uploadBtn);
                
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                uploadContainer.appendChild(fileInput);
                
                photoWrapper.appendChild(uploadContainer);
                group.appendChild(photoWrapper);
                
                const pathInput = document.createElement('input');
                pathInput.type = 'hidden';
                pathInput.name = 'photo_path';
                pathInput.value = value || '';
                group.appendChild(pathInput);
                
                const base64Input = document.createElement('input');
                base64Input.type = 'hidden';
                base64Input.name = 'photo_base64';
                base64Input.value = '';
                group.appendChild(base64Input);
                
                uploadBtn.addEventListener('click', () => fileInput.click());
                
                fileInput.addEventListener('change', () => {
                    const file = fileInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            img.src = e.target.result;
                            base64Input.value = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                parent.appendChild(group);
                return;
            }

            const group = document.createElement('div');
            group.className = 'form-group';
            group.dataset.key = key;
            
            const label = document.createElement('label');
            label.textContent = formatLabel(key);
            group.appendChild(label);

            if (typeof value === 'string' || typeof value === 'number' || value === null) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.name = key;
                input.dataset.type = 'scalar';
                if (!input.value) group.classList.add('empty');
                group.appendChild(input);
            } 
            else if (Array.isArray(value)) {
                const container = document.createElement('div');
                container.className = 'array-container';
                container.dataset.type = 'array';
                
                // Si c'est un tableau de chaînes (ex: hard_skills, outils), on l'affiche en bulles
                const isPrimitiveArray = value.length > 0 && (typeof value[0] === 'string' || typeof value[0] === 'number');
                if (isPrimitiveArray || key === 'hard_skills' || key === 'soft_skills' || key === 'outils_et_technologies' || key === 'langues') {
                    container.style.flexDirection = 'row';
                    container.style.flexWrap = 'wrap';
                    container.style.gap = '8px';
                }
                
                if (value.length === 0) {
                    group.classList.add('empty');
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'Ajouter un élément...';
                    input.dataset.type = 'array-item';
                    if (key === 'hard_skills' || key === 'soft_skills' || key === 'outils_et_technologies' || key === 'langues') {
                        input.className = 'bubble-input';
                    }
                    container.appendChild(input);
                } else {
                    value.forEach((item) => {
                        if (typeof item === 'string' || typeof item === 'number') {
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = item;
                            input.dataset.type = 'array-item';
                            if (isPrimitiveArray) {
                                input.className = 'bubble-input';
                            }
                            container.appendChild(input);
                        } else if (typeof item === 'object' && item !== null) {
                            const objContainer = document.createElement('div');
                            objContainer.className = 'object-item';
                            
                            if (key === 'projets_et_experiences' || key === 'formations' || key === 'langues') {
                                const headerDiv = document.createElement('div');
                                headerDiv.style.display = 'flex';
                                headerDiv.style.alignItems = 'center';
                                headerDiv.style.marginBottom = '10px';
                                headerDiv.style.background = 'rgba(0,0,0,0.05)';
                                headerDiv.style.padding = '8px';
                                headerDiv.style.borderRadius = '6px';
                                
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.checked = true;
                                checkbox.className = 'item-selector';
                                checkbox.style.marginRight = '10px';
                                checkbox.style.cursor = 'pointer';
                                
                                const titleSpan = document.createElement('span');
                                titleSpan.textContent = 'Inclure dans le PPTX';
                                titleSpan.style.fontSize = '0.9rem';
                                titleSpan.style.color = 'var(--brand-blue)';
                                titleSpan.style.fontWeight = 'bold';
                                
                                headerDiv.appendChild(checkbox);
                                headerDiv.appendChild(titleSpan);
                                objContainer.appendChild(headerDiv);
                                
                                checkbox.addEventListener('change', (e) => {
                                    objContainer.style.opacity = e.target.checked ? '1' : '0.4';
                                });
                            }
                            
                            for (const [subKey, subVal] of Object.entries(item)) {
                                const subLabel = document.createElement('div');
                                subLabel.textContent = formatLabel(subKey);
                                subLabel.style.fontSize = "0.8rem";
                                subLabel.style.color = "var(--light-text-secondary)";
                                subLabel.style.marginBottom = "2px";
                                
                                const isTextarea = Array.isArray(subVal) || (typeof subVal === 'string' && subVal.length > 50);
                                const subInput = document.createElement(isTextarea ? 'textarea' : 'input');
                                if (!isTextarea) subInput.type = 'text';
                                subInput.dataset.subkey = subKey;
                                
                                if (Array.isArray(subVal)) {
                                    subInput.value = subVal.join(", ");
                                    subInput.dataset.isarray = 'true';
                                } else if (typeof subVal === 'object' && subVal !== null) {
                                    subInput.value = JSON.stringify(subVal);
                                } else {
                                    subInput.value = subVal || '';
                                }
                                subInput.style.marginBottom = "8px";
                                
                                objContainer.appendChild(subLabel);
                                objContainer.appendChild(subInput);
                            }
                            container.appendChild(objContainer);
                        }
                    });
                }
                group.appendChild(container);
            }
            else if (typeof value === 'object' && value !== null) {
                const container = document.createElement('div');
                container.className = 'array-container';
                container.dataset.type = 'object';
                
                for (const [subKey, subVal] of Object.entries(value)) {
                    const subLabel = document.createElement('div');
                    subLabel.textContent = formatLabel(subKey);
                    subLabel.style.fontSize = "0.85rem";
                    subLabel.style.color = "var(--light-text-secondary)";
                    subLabel.style.marginBottom = "4px";
                    
                    const isTextarea = Array.isArray(subVal) || (typeof subVal === 'string' && subVal.length > 50);
                    const subInput = document.createElement(isTextarea ? 'textarea' : 'input');
                    if (!isTextarea) subInput.type = 'text';
                    subInput.dataset.subkey = subKey;
                    
                    if (Array.isArray(subVal)) {
                        subInput.value = subVal.join(", ");
                        subInput.dataset.isarray = 'true';
                    } else if (typeof subVal === 'object' && subVal !== null) {
                        subInput.value = JSON.stringify(subVal);
                    } else {
                        subInput.value = subVal || '';
                    }
                    subInput.style.marginBottom = "10px";
                    
                    container.appendChild(subLabel);
                    container.appendChild(subInput);
                }
                group.appendChild(container);
            }
            parent.appendChild(group);
        }

        for (const [key, value] of Object.entries(data)) {
            if (key === 'photo_base64') continue;
            renderValue(key, value, profileForm);
        }

        profileForm.addEventListener('input', (e) => {
            if (e.target.value.trim() !== '') {
                const group = e.target.closest('.form-group');
                if (group) group.classList.remove('empty');
            }
        });
    }

    function gatherFormData() {
        const formData = {};
        const groups = profileForm.querySelectorAll('.form-group');
        
        groups.forEach(group => {
            const key = group.dataset.key;
            if (!key) return;
            
            if (key === 'photo_path') {
                const pathInput = group.querySelector('input[name="photo_path"]');
                const base64Input = group.querySelector('input[name="photo_base64"]');
                formData['photo_path'] = pathInput ? pathInput.value : '';
                formData['photo_base64'] = base64Input ? base64Input.value : '';
                return;
            }
            
            const scalarInput = group.querySelector(`input[name="${key}"][data-type="scalar"]`);
            if (scalarInput) {
                formData[key] = scalarInput.value.trim();
                return;
            }
            
            const container = group.querySelector('.array-container');
            if (container) {
                const containerType = container.dataset.type;
                
                if (containerType === 'array') {
                    const items = [];
                    const simpleInputs = container.querySelectorAll('input[data-type="array-item"]');
                    if (simpleInputs.length > 0) {
                        simpleInputs.forEach(inp => {
                            const val = inp.value.trim();
                            if (val) items.push(val);
                        });
                    } else {
                        const objItems = container.querySelectorAll('.object-item');
                        objItems.forEach(objDiv => {
                            const checkbox = objDiv.querySelector('.item-selector');
                            if (checkbox && !checkbox.checked) return;
                            
                            const obj = {};
                            const subInputs = objDiv.querySelectorAll('[data-subkey]');
                            subInputs.forEach(subInp => {
                                const subKey = subInp.dataset.subkey;
                                const isArray = subInp.dataset.isarray === 'true';
                                const val = subInp.value.trim();
                                
                                if (isArray) {
                                    obj[subKey] = val.split(',').map(s => s.trim()).filter(Boolean);
                                } else {
                                    obj[subKey] = val;
                                }
                            });
                            items.push(obj);
                        });
                    }
                    formData[key] = items;
                } else if (containerType === 'object') {
                    const obj = {};
                    const subInputs = container.querySelectorAll('[data-subkey]');
                    subInputs.forEach(subInp => {
                        const subKey = subInp.dataset.subkey;
                        const isArray = subInp.dataset.isarray === 'true';
                        const val = subInp.value.trim();
                        
                        if (isArray) {
                            obj[subKey] = val.split(',').map(s => s.trim()).filter(Boolean);
                        } else {
                            obj[subKey] = val;
                        }
                    });
                    formData[key] = obj;
                }
            }
        });
        
        return formData;
    }

    function formatLabel(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'error') {
            icon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        } else if (type === 'success') {
            icon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        } else {
            icon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        }

        toast.innerHTML = `${icon}<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) container.removeChild(toast);
            }, 400);
        }, 4000);
    }
});
