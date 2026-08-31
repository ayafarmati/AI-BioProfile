import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UploadCloud, LayoutTemplate, Loader2, Sparkles, BookOpen } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [activeBatches, setActiveBatches] = useState({});
  const [realProfiles, setRealProfiles] = useState([]);

  useEffect(() => {
    const fetchActiveBatches = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/active-batches');
        if (res.ok) {
          const data = await res.json();
          setActiveBatches(data);
        }
      } catch (e) {
        console.error("Erreur lors de la récupération des batchs actifs", e);
      }
    };
    
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const data = await res.json();
          setRealProfiles(data.slice(0, 4)); // Show top 4
        }
      } catch (e) {
        console.error("Erreur récupération profils", e);
      }
    };

    fetchActiveBatches();
    fetchProfiles();
    const interval = setInterval(fetchActiveBatches, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-layout fade-in" style={{ background: 'var(--bg-main)' }}>

      <main className="main-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Bento Grid Container */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '1.5rem',
          gridAutoRows: 'minmax(120px, auto)'
        }}>

          {/* 1. Main Welcome & Upload Card (Spans 8 cols, 2 rows) */}
          <div className="card bento-card" onClick={() => navigate('/upload')} style={{ 
            gridColumn: 'span 8', 
            gridRow: 'span 2', 
            background: 'var(--bg-surface)', 
            border: '2px solid transparent',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            transition: 'var(--transition)'
          }}>
            {/* Glowing background effect */}
            <div style={{ 
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
              background: 'radial-gradient(circle, rgba(14,124,134,0.05) 0%, rgba(255,255,255,0) 70%)',
              zIndex: 0, pointerEvents: 'none'
            }} />
            
            <div style={{ background: 'var(--brand-teal-light)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', zIndex: 1, border: '4px solid white', boxShadow: 'var(--shadow-sm)' }}>
              <UploadCloud size={48} style={{ color: 'var(--brand-teal)' }} />
            </div>
            
            <h2 style={{ fontSize: '2.5rem', color: 'var(--brand-navy)', marginBottom: '0.5rem', zIndex: 1, fontWeight: 700 }}>
              AI BioProfile
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '400px', zIndex: 1, lineHeight: 1.5 }}>
              Importez un CV et laissez notre Intelligence Artificielle générer une présentation PowerPoint optimisée.
            </p>
            
            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-teal)', fontWeight: 600, zIndex: 1, background: 'var(--bg-subtle)', padding: '0.5rem 1.25rem', borderRadius: '30px' }}>
              <Sparkles size={18} /> Démarrer l'analyse
            </div>
          </div>



          {/* 3. Templates Shortcut (Spans 4 cols, 1 row) */}
          <div className="card bento-card" onClick={() => navigate('/templates')} style={{ 
            gridColumn: 'span 4', 
            gridRow: 'span 1', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'var(--transition)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: '#f3e8ff', padding: '0.75rem', borderRadius: '10px' }}>
                <LayoutTemplate size={24} style={{ color: '#9333ea' }} />
              </div>
              <ChevronRight style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Modèles PPTX</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Gérer les templates et styles par défaut.</p>
          </div>

          {/* 4. Tips / Guide Card (Spans 4 cols, 1 row) */}
          <div className="card bento-card" onClick={() => navigate('/guide')} style={{ 
            gridColumn: 'span 4', 
            gridRow: 'span 1', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'var(--transition)',
            boxShadow: 'var(--shadow-sm)',
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: '10px' }}>
                <BookOpen size={24} style={{ color: '#0284c7' }} />
              </div>
              <ChevronRight style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Guide d'utilisation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>Guide interactif pour maîtriser toutes les fonctionnalités de l'application.</p>
          </div>

          {/* 5. Active Processing (Dynamic Span) */}
          {Object.keys(activeBatches).length > 0 && (
            <div className="card bento-card" style={{ gridColumn: 'span 12', padding: '1.5rem', background: 'var(--brand-teal-light)', borderColor: 'var(--brand-teal)' }}>
               <h3 style={{ color: 'var(--brand-teal)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Loader2 className="spinner" size={20} /> Traitements IA en cours...
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {Object.keys(activeBatches).map(jobId => (
                  <div key={jobId} onClick={() => navigate(`/processing/${jobId}`)} style={{ background: 'white', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Lot #{jobId.substring(0, 8)}</h4>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cliquez pour suivre...</span>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--brand-teal)' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Recent Activity List (Spans 8 cols, dynamic height) */}
          <div className="card bento-card" style={{ gridColumn: 'span 12', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>Derniers Profils Générés</h3>
              <button onClick={() => navigate('/recent')} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'white' }}>
                Tout voir
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {realProfiles.length > 0 ? realProfiles.map((profile, idx) => {
                const profileId = profile.id || profile.filename || '';
                const name = profile.nom_complet || 'Anonyme';
                const role = profile.titre_professionnel || 'Aucun titre professionnel';
                return (
                  <div key={profileId} className="recent-item-hover" onClick={() => navigate(`/bioprofiles/${profileId}`)} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: idx !== realProfiles.length - 1 ? '1px solid var(--border-light)' : 'none',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-teal)', fontWeight: 'bold' }}>
                        {profile.photo_path ? (
                          <img src={profile.photo_path} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{name}</h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{role}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                );
              }) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Sparkles size={24} style={{ color: 'var(--border-focus)', marginBottom: '1rem' }} />
                  Aucun profil généré récemment.<br/>Importez un CV pour commencer.
                </div>
              )}
            </div>
          </div>
          
        </div>

      </main>

      <style>{`
        .bento-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .recent-item-hover:hover {
          background: var(--bg-subtle);
        }
      `}</style>
    </div>
  );
}
