let allProfiles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadRecentProfiles();
    
    // Configurer la barre de recherche
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterProfiles(query);
        });
    }
});

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderProfiles(profilesToRender) {
    const container = document.getElementById('profiles-container');
    const noProfilesMsg = document.getElementById('no-profiles');
    
    container.innerHTML = '';
    
    if (profilesToRender.length === 0) {
        noProfilesMsg.classList.remove('hidden');
        // Si c'est une recherche qui ne donne rien, changer le texte
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value.trim() !== '') {
            noProfilesMsg.querySelector('h3').textContent = 'Aucun résultat trouvé';
            noProfilesMsg.querySelector('p').textContent = 'Essayez avec un autre nom ou titre.';
        } else {
            noProfilesMsg.querySelector('h3').textContent = 'Aucun profil récent';
            noProfilesMsg.querySelector('p').textContent = 'Commencez par extraire un nouveau CV pour le voir apparaître ici.';
        }
        return;
    }
    
    noProfilesMsg.classList.add('hidden');
    
    profilesToRender.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        // Format date
        const date = new Date(profile.timestamp * 1000);
        const dateStr = date.toLocaleDateString('fr-FR', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const photoSrc = profile.photo_path || 'https://via.placeholder.com/80?text=Photo';
        
        let voirCvBtn = '';
        if (profile.pdf_path && profile.pdf_path !== '') {
            voirCvBtn = `<button class="btn-outline" onclick="window.open('${profile.pdf_path}', '_blank')" title="Voir le CV original">Voir CV</button>`;
        }
        
        card.innerHTML = `
            <img src="${photoSrc}" alt="Photo de ${profile.nom_complet}" class="profile-photo" onerror="this.src='https://via.placeholder.com/80?text=Photo'">
            <h3 class="profile-name">${profile.nom_complet || 'Sans Nom'}</h3>
            <p class="profile-title">${profile.titre_professionnel || 'Aucun titre renseigné'}</p>
            <p class="profile-date">Modifié le ${dateStr}</p>
            <div class="profile-actions" style="flex-wrap: wrap;">
                ${voirCvBtn}
                <button class="btn-outline" onclick="openProfile('${profile.filename}')" title="Éditer le profil">Éditer</button>
                <button class="btn-fill" onclick="generatePPT('${profile.filename}')" title="Générer PowerPoint">Générer PPT</button>
                <button class="btn-delete" onclick="deleteProfile('${profile.filename}', '${profile.nom_complet ? profile.nom_complet.replace(/'/g, "\\'") : 'ce profil'}')" title="Supprimer le profil">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function filterProfiles(query) {
    if (!query) {
        renderProfiles(allProfiles);
        return;
    }
    
    const filtered = allProfiles.filter(p => {
        const nom = (p.nom_complet || '').toLowerCase();
        const titre = (p.titre_professionnel || '').toLowerCase();
        return nom.includes(query) || titre.includes(query);
    });
    
    renderProfiles(filtered);
}

async function loadRecentProfiles() {
    const noProfilesMsg = document.getElementById('no-profiles');
    const loader = document.getElementById('loader');
    
    loader.classList.remove('hidden');
    noProfilesMsg.classList.add('hidden');
    
    try {
        const response = await fetch('/api/profiles');
        allProfiles = await response.json();
        
        loader.classList.add('hidden');
        renderProfiles(allProfiles);
        
        // Appliquer le filtre si la barre de recherche n'est pas vide
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value) {
            filterProfiles(searchInput.value.toLowerCase());
        }
        
    } catch (error) {
        loader.classList.add('hidden');
        console.error('Erreur:', error);
        showToast('Erreur lors du chargement des profils', 'error');
    }
}

async function deleteProfile(filename, nom) {
    if (!confirm(`Voulez-vous vraiment supprimer le profil de ${nom} ?\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/profiles/${filename}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur réseau');
        
        showToast('Profil supprimé avec succès');
        
        // Retirer le profil du tableau en mémoire
        allProfiles = allProfiles.filter(p => p.filename !== filename);
        
        // Réafficher en conservant le filtre actif
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value) {
            filterProfiles(searchInput.value.toLowerCase());
        } else {
            renderProfiles(allProfiles);
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

async function openProfile(filename) {
    try {
        // Rediriger vers l'application principale avec le nom du fichier en paramètre
        window.location.href = `/app#/bioprofiles/${encodeURIComponent(filename)}`;
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Impossible d\'ouvrir le profil', 'error');
    }
}

async function generatePPT(filename) {
    try {
        // D'abord, charger les données du profil pour s'assurer qu'elles sont dans resultat_cv.json
        showToast('Préparation de la présentation...', 'success');
        
        const profileRes = await fetch(`/api/profiles/${filename}`);
        if (!profileRes.ok) throw new Error('Erreur lors du chargement des données');
        const data = await profileRes.json();
        
        data.template = localStorage.getItem('selected_template') || 'BioProfile_OFF.pptx';
        
        // Ensuite, générer le PPTX
        const pptRes = await fetch('/api/generate-ppt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!pptRes.ok) throw new Error('Erreur lors de la génération');
        
        // Télécharger le fichier
        const blob = await pptRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BioProfile_${data.nom_complet ? data.nom_complet.replace(/\s+/g, '_') : 'Generated'}.pptx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        showToast('Présentation générée avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la génération du PPT', 'error');
    }
}
