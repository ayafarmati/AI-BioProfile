document.addEventListener('DOMContentLoaded', () => {
    const templatesContainer = document.getElementById('templates-container');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('template-upload');
    const loader = document.getElementById('loader');
    
    // Initialize default template if not set
    if (!localStorage.getItem('selected_template')) {
        localStorage.setItem('selected_template', 'BioProfile_OFF.pptx');
    }
    
    // Load templates
    loadTemplates();
    
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    async function loadTemplates() {
        try {
            loader.classList.remove('hidden');
            templatesContainer.innerHTML = '';
            
            const response = await fetch('/api/templates');
            const templates = await response.json();
            
            const selectedTemplate = localStorage.getItem('selected_template');
            
            templates.forEach(template => {
                const isSelected = template.filename === selectedTemplate;
                
                const card = document.createElement('div');
                card.className = `template-card ${isSelected ? 'active' : ''}`;
                
                const thumbSrc = template.thumbnail ? template.thumbnail : 'https://via.placeholder.com/400x225?text=Template+PPT';
                
                card.innerHTML = `
                    <div class="active-badge">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        Sélectionné
                    </div>
                    <img src="${thumbSrc}" class="template-thumb" alt="Miniature de ${template.filename}" onerror="this.src='https://via.placeholder.com/400x225?text=Pas+d\\'image'">
                    <div class="template-info">
                        <div class="template-name">${template.filename}</div>
                        
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button class="btn-outline" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;" onclick="window.open('/templates/${template.filename}', '_blank')">Afficher</button>
                            ${template.filename !== 'BioProfile_OFF.pptx' ? `<button class="btn-delete" style="flex: 0 0 auto; padding: 0.5rem;" onclick="deleteTemplate('${template.filename}')" title="Supprimer"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>` : ''}
                        </div>

                        <button class="btn-set-default" style="margin-top: 0.5rem;" onclick="setDefaultTemplate('${template.filename}')">
                            ${isSelected ? 'Modèle par défaut' : 'Choisir ce modèle'}
                        </button>
                    </div>
                `;
                
                templatesContainer.appendChild(card);
            });
            
        } catch (error) {
            console.error(error);
            showToast("Erreur lors du chargement des modèles", "error");
        } finally {
            loader.classList.add('hidden');
        }
    }
    
    window.deleteTemplate = async function(filename) {
        if (!confirm(`Voulez-vous vraiment supprimer le modèle ${filename} ?`)) return;
        
        try {
            const response = await fetch(`/api/templates/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Erreur lors de la suppression");
            }
            
            showToast("Modèle supprimé avec succès !");
            
            // If we deleted the default template, reset it
            if (localStorage.getItem('selected_template') === filename) {
                localStorage.setItem('selected_template', 'BioProfile_OFF.pptx');
            }
            
            loadTemplates();
        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        }
    };
    
    window.setDefaultTemplate = function(filename) {
        localStorage.setItem('selected_template', filename);
        showToast("Modèle par défaut mis à jour !");
        loadTemplates();
    };
    
    // Upload logic
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--brand-teal)';
        uploadZone.style.background = 'rgba(32, 178, 170, 0.05)';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--brand-teal-light)';
        uploadZone.style.background = 'white';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--brand-teal-light)';
        uploadZone.style.background = 'white';
        
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    });
    
    async function handleUpload(file) {
        if (!file.name.toLowerCase().endsWith('.pptx')) {
            showToast("Veuillez sélectionner un fichier .pptx valide.", "error");
            return;
        }
        
        showToast("Upload en cours... Extraction de l'image de couverture...", "success");
        loader.classList.remove('hidden');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload-template', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error("Erreur lors de l'upload");
            }
            
            const result = await response.json();
            
            // Set it as default right away
            localStorage.setItem('selected_template', result.filename);
            
            showToast("Modèle ajouté et défini par défaut !");
            loadTemplates();
        } catch (error) {
            console.error(error);
            showToast(error.message || "Une erreur est survenue", "error");
        } finally {
            loader.classList.add('hidden');
            fileInput.value = '';
        }
    }
});
