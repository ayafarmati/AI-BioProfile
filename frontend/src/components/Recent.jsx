import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Home, Plus, Clock, FileText, Search, Loader2, Trash2, FolderX } from 'lucide-react';
import Modal from './Modal';

export default function Recent() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (options) => setModalConfig({ ...options, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/profiles');
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDelete = (id) => {
    showModal({
      title: "Supprimer le profil",
      message: "Êtes-vous sûr de vouloir supprimer ce profil ? Cette action est irréversible.",
      type: "danger",
      confirmText: "Supprimer",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/profiles/${id}`);
          fetchProfiles();
        } catch (err) {
          showModal({ title: "Erreur", message: "Erreur lors de la suppression.", type: "alert", confirmText: "Fermer" });
        }
      }
    });
  };

  const filteredProfiles = profiles.filter(p => {
    const term = search.toLowerCase();
    const nameMatch = (p.nom_complet || '').toLowerCase().includes(term);
    const titleMatchBasic = (p.titre_professionnel || '').toLowerCase().includes(term);
    
    const skillTerm = skillFilter.toLowerCase();
    const allSkills = [...(p.technical_skills || []), ...(p.tools || [])].join(' ').toLowerCase();
    const hasSkill = skillTerm === '' || allSkills.includes(skillTerm);

    const jobTerm = jobFilter.toLowerCase();
    const titleMatchAdvanced = jobTerm === '' || (p.titre_professionnel || '').toLowerCase().includes(jobTerm);

    return (nameMatch || titleMatchBasic) && hasSkill && titleMatchAdvanced;
  });

  return (
    <div className="dashboard-layout fade-in">

      {/* Main Content */}
      <main className="main-content">
        <div className="page-container">
          <div className="validation-header">
            <h2>Profils Récents</h2>
            <p className="subtitle">Retrouvez ici l'historique des profils générés. Vous pouvez les modifier, les supprimer ou relancer la génération PPT.</p>
          </div>
          
          <div className="search-filters-container" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem', marginBottom: '2rem' }}>
            <div className="search-box" style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search className="search-icon" size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Rechercher par nom..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '1rem 1rem 1rem 3rem', border: '1px solid var(--border-light)',
                  borderRadius: '30px', fontSize: '0.95rem', background: 'white', boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>
            
            <div className="filter-box" style={{ flex: '1 1 200px' }}>
              <input 
                type="text" 
                placeholder="Filtrer par poste (ex: Data Engineer)" 
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                style={{
                  width: '100%', padding: '1rem', border: '1px solid var(--border-light)',
                  borderRadius: '30px', fontSize: '0.95rem', background: 'white', boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>

            <div className="filter-box" style={{ flex: '1 1 200px' }}>
              <input 
                type="text" 
                placeholder="Filtrer par compétence (ex: Python)" 
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                style={{
                  width: '100%', padding: '1rem', border: '1px solid var(--border-light)',
                  borderRadius: '30px', fontSize: '0.95rem', background: 'white', boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: 'var(--brand-teal)', margin: '0 auto' }} />
              <p style={{ marginTop: '1rem' }}>Chargement des profils...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <FolderX size={60} style={{ color: 'var(--border-focus)', marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-muted)' }}>Aucun profil récent</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Commencez par extraire un nouveau CV pour le voir apparaître ici.</p>
            </div>
          ) : (
            <div className="profiles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {filteredProfiles.map(profile => {
                const profileId = profile.id || profile.filename || '';
                return (
                <div key={profileId} className="card hover-float" style={{
                  padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                }}>
                  <div className="profile-photo" style={{
                    width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-subtle)',
                    border: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem', color: 'var(--brand-teal-light)', overflow: 'hidden'
                  }}>
                    {profile.photo_path ? (
                      <img src={profile.photo_path} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      profile.nom_complet ? profile.nom_complet.substring(0, 2).toUpperCase() : '??'
                    )}
                  </div>
                  <h3 className="profile-name" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {profile.nom_complet || 'Anonyme'}
                  </h3>
                  <p className="profile-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', height: '40px', overflow: 'hidden' }}>
                    {profile.titre_professionnel || 'Aucun titre professionnel'}
                  </p>
                  
                  {/* Top 3 Skills Preview */}
                  <div className="skills-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '1.5rem', minHeight: '44px', alignContent: 'flex-start' }}>
                    {(() => {
                      const topSkills = [...(profile.tools || []), ...(profile.technical_skills || [])].slice(0, 3);
                      if (topSkills.length === 0) return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aucune compétence reconnue</span>;
                      return topSkills.map((s, idx) => (
                        <span key={idx} style={{ fontSize: '0.75rem', background: 'var(--brand-teal-light)', color: 'var(--brand-teal)', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                          {s.length > 20 ? s.substring(0, 20) + '...' : s}
                        </span>
                      ));
                    })()}
                  </div>
                  <div className="profile-actions" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '0.6rem' }}
                      onClick={() => navigate(`/bioprofiles/${profileId}`)}
                    >
                      Éditer
                    </button>
                    <button 
                      className="btn-delete" 
                      style={{ flex: '0 0 40px', padding: '0.6rem', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => handleDelete(profileId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </main>
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}
