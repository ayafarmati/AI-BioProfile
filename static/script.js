document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extract-btn');
    const cvInput = document.getElementById('cv-input');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    const loadingState = document.getElementById('loading-state');
    const validationSection = document.getElementById('validation-section');
    const uploadSection = document.getElementById('upload-section');
    const profileForm = document.getElementById('profile-form');
    const emptyState = document.getElementById('empty-state');
    const generatePptBtn = document.getElementById('generate-ppt-btn');

    // --- Click to select file ---
    dropZone.addEventListener('click', (e) => {
        if (e.target !== cvInput) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = `Fichier sélectionné : ${fileInput.files[0].name}`;
            cvInput.value = ''; // Clear text if file selected
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
            fileNameDisplay.textContent = `Fichier sélectionné : ${fileInput.files[0].name}`;
            cvInput.value = '';
        }
    });

    extractBtn.addEventListener('click', async () => {
        const text = cvInput.value.trim();
        const file = fileInput.files[0];

        if (!text && !file) {
            showToast('Veuillez sélectionner un fichier ou coller le texte du CV.', 'error');
            return;
        }

        // UI States
        // Ne plus cacher l'upload section (elle est dans la sidebar) mais on peut la désactiver si besoin
        if (emptyState) emptyState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        validationSection.classList.add('hidden');

        try {
            let response;
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                response = await fetch('/api/extract-file', {
                    method: 'POST',
                    body: formData
                });
            } else {
                response = await fetch('/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cv_text: text })
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Erreur API: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Build the form
            buildForm(data);

            // Switch UI
            loadingState.classList.add('hidden');
            validationSection.classList.remove('hidden');

        } catch (error) {
            showToast('Erreur lors de l\'extraction: ' + error.message, 'error');
            loadingState.classList.add('hidden');
            if (emptyState && validationSection.classList.contains('hidden')) {
                emptyState.classList.remove('hidden');
            }
        }
    });

    if (generatePptBtn) {
        generatePptBtn.addEventListener('click', async () => {
            const formData = gatherFormData();
            
            // Basic validation
            if (!formData.nom_complet) {
                showToast('Le nom complet est obligatoire.', 'error');
                return;
            }
            
            generatePptBtn.disabled = true;
            generatePptBtn.innerHTML = '<svg class="btn-icon" style="animation: spin 1s linear infinite;" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Génération...';

            try {
                const response = await fetch('/api/generate-ppt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) throw new Error('Erreur de génération du PPT');
                
                // Get the blob and download it
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `BioProfile_${formData.nom_complet.replace(/\s+/g, '_')}.pptx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                
                showToast('Présentation générée avec succès !', 'success');
                
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                generatePptBtn.disabled = false;
                generatePptBtn.innerHTML = '<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Générer la Bio (PPT)';
            }
        });
    }

    function buildForm(data) {
        profileForm.innerHTML = ''; // Clear previous

        // S'assurer qu'il y a un champ photo_path de validation dans le formulaire
        if (data.photo_path === undefined) {
            data.photo_path = "";
        }

        // S'assurer qu'il y a un champ titre_professionnel de validation dans le formulaire
        if (!data.titre_professionnel && !data.professional_title) {
            data.titre_professionnel = "";
        }

        function renderValue(key, value, parent) {
            // Rendu spécifique pour l'aperçu et le changement de la photo de profil
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
                photoWrapper.style.background = 'rgba(0, 0, 0, 0.2)';
                photoWrapper.style.padding = '15px';
                photoWrapper.style.borderRadius = '12px';
                
                const img = document.createElement('img');
                img.id = 'profile-preview-img';
                img.style.width = '80px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid var(--primary)';
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
                
                const helpText = document.createElement('span');
                helpText.textContent = 'Format JPG/PNG recommandé (le template l\'adaptera).';
                helpText.style.fontSize = '0.8rem';
                helpText.style.color = 'var(--text-secondary)';
                uploadContainer.appendChild(helpText);
                
                photoWrapper.appendChild(uploadContainer);
                group.appendChild(photoWrapper);
                
                // Champs cachés pour photo_path et photo_base64
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
                            base64Input.value = e.target.result; // Contient le Base64
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                parent.appendChild(group);
                return;
            }

            const group = document.createElement('div');
            group.className = 'form-group';
            group.dataset.key = key; // Métadonnée clé principale
            
            const label = document.createElement('label');
            label.textContent = formatLabel(key);
            group.appendChild(label);

            if (typeof value === 'string' || typeof value === 'number' || value === null) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.name = key;
                input.dataset.type = 'scalar'; // Métadonnée type simple
                if (!input.value) group.classList.add('empty');
                group.appendChild(input);
            } 
            else if (Array.isArray(value)) {
                const container = document.createElement('div');
                container.className = 'array-container';
                container.dataset.type = 'array'; // Métadonnée type conteneur tableau
                
                if (value.length === 0) {
                    group.classList.add('empty');
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'Ajouter un élément...';
                    input.dataset.type = 'array-item';
                    container.appendChild(input);
                } else {
                    value.forEach((item) => {
                        if (typeof item === 'string' || typeof item === 'number') {
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = item;
                            input.dataset.type = 'array-item'; // Métadonnée type élément simple du tableau
                            container.appendChild(input);
                        } else if (typeof item === 'object' && item !== null) {
                            const objContainer = document.createElement('div');
                            objContainer.className = 'object-item'; // Permet de repérer les objets dans le tableau
                            objContainer.style.borderLeft = "2px solid var(--primary)";
                            objContainer.style.paddingLeft = "10px";
                            objContainer.style.marginBottom = "10px";
                            
                            for (const [subKey, subVal] of Object.entries(item)) {
                                const subLabel = document.createElement('div');
                                subLabel.textContent = formatLabel(subKey);
                                subLabel.style.fontSize = "0.8rem";
                                subLabel.style.color = "var(--text-secondary)";
                                subLabel.style.marginBottom = "2px";
                                
                                const isTextarea = Array.isArray(subVal) || (typeof subVal === 'string' && subVal.length > 50);
                                const subInput = document.createElement(isTextarea ? 'textarea' : 'input');
                                if (!isTextarea) subInput.type = 'text';
                                subInput.dataset.subkey = subKey; // Métadonnée clé de l'objet
                                
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
                container.dataset.type = 'object'; // Métadonnée type conteneur objet
                
                for (const [subKey, subVal] of Object.entries(value)) {
                    const subLabel = document.createElement('div');
                    subLabel.textContent = formatLabel(subKey);
                    subLabel.style.fontSize = "0.85rem";
                    subLabel.style.color = "var(--text-secondary)";
                    subLabel.style.marginBottom = "4px";
                    
                    const isTextarea = Array.isArray(subVal) || (typeof subVal === 'string' && subVal.length > 50);
                    const subInput = document.createElement(isTextarea ? 'textarea' : 'input');
                    if (!isTextarea) subInput.type = 'text';
                    subInput.dataset.subkey = subKey; // Métadonnée clé de l'objet
                    
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
            renderValue(key, value, profileForm);
        }

        // Remove empty class on typing
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
            
            // Collecte spécifique pour la photo
            if (key === 'photo_path') {
                const pathInput = group.querySelector('input[name="photo_path"]');
                const base64Input = group.querySelector('input[name="photo_base64"]');
                formData['photo_path'] = pathInput ? pathInput.value : '';
                formData['photo_base64'] = base64Input ? base64Input.value : '';
                return;
            }
            
            // 1. Champ scalaire simple
            const scalarInput = group.querySelector(`input[name="${key}"][data-type="scalar"]`);
            if (scalarInput) {
                formData[key] = scalarInput.value.trim();
                return;
            }
            
            // 2. Conteneur complexe
            const container = group.querySelector('.array-container');
            if (container) {
                const containerType = container.dataset.type;
                
                if (containerType === 'array') {
                    const items = [];
                    // Cas simple : liste de chaînes de caractères
                    const simpleInputs = container.querySelectorAll('input[data-type="array-item"]');
                    if (simpleInputs.length > 0) {
                        simpleInputs.forEach(inp => {
                            const val = inp.value.trim();
                            if (val) items.push(val);
                        });
                    } 
                    // Cas complexe : liste d'objets (ex: projets ou langues)
                    else {
                        const objItems = container.querySelectorAll('.object-item');
                        objItems.forEach(objDiv => {
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
                } 
                else if (containerType === 'object') {
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

    // --- Toast Notification System ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Icon based on type
        let icon = '';
        if (type === 'error') {
            icon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        } else if (type === 'success') {
            icon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        } else {
            icon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        }

        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 400); // Wait for transition
        }, 4000);
    }
});
