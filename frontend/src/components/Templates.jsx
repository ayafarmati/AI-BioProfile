import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Home, Plus, Clock, FileText, UploadCloud, CheckCircle2, Info } from 'lucide-react';
import Modal from './Modal';

function CopyableTag({ tag }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <code
      onClick={handleCopy}
      style={{
        background: copied ? 'var(--success-bg)' : 'white',
        padding: '2px 8px',
        borderRadius: '6px',
        border: `1px solid ${copied ? 'var(--success)' : 'var(--border-light)'}`,
        color: copied ? 'var(--success)' : 'var(--brand-teal)',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        marginRight: '8px'
      }}
      title="Cliquez pour copier"
    >
      {tag}
      {copied ? <CheckCircle2 size={12} /> : null}
    </code>
  );
}

export default function Templates() {
  const fileInputRef = useRef(null);
  const [activeTemplate, setActiveTemplate] = useState(() => {
    return localStorage.getItem('default_template') || 'BioProfile_OFF.pptx';
  });
  const [isDragging, setIsDragging] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [templates, setTemplates] = useState([]);

  const showModal = (options) => setModalConfig({ ...options, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates');
      setTemplates(res.data);
    } catch (e) {
      console.error("Failed to fetch templates", e);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      showModal({ title: "Format invalide", message: "Veuillez uploader un fichier .pptx.", type: "alert", confirmText: "Fermer" });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      showModal({ title: "Envoi en cours", message: "Génération de la miniature et téléchargement...", type: "info" });
      await axios.post('/api/upload-template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      closeModal();
      fetchTemplates();
    } catch (e) {
      showModal({ title: "Erreur", message: "Impossible d'uploader le modèle.", type: "alert", confirmText: "Fermer" });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSetDefault = (filename) => {
    setActiveTemplate(filename);
    localStorage.setItem('default_template', filename);
  };

  const handleDeleteTemplate = async (filename) => {
    if (filename === 'BioProfile_OFF.pptx') return;
    if (window.confirm(`Voulez-vous vraiment supprimer ${filename} ?`)) {
      try {
        await axios.delete(`/api/templates/${filename}`);
        if (activeTemplate === filename) {
          handleSetDefault('BioProfile_OFF.pptx');
        }
        fetchTemplates();
      } catch (e) {
        showModal({ title: "Erreur", message: "Impossible de supprimer le modèle.", type: "alert", confirmText: "Fermer" });
      }
    }
  };

  return (
    <div className="dashboard-layout fade-in">

      {/* Main Content */}
      <main className="main-content">
        <div className="page-container">
          <div className="validation-header">
            <h2>Gestion des Modèles PPT</h2>
            <p className="subtitle">Sélectionnez le modèle par défaut ou ajoutez-en de nouveaux. L'IA utilisera le modèle sélectionné pour générer les présentations.</p>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pptx" style={{ display: 'none' }} />
          <div className="upload-template-area"
            style={{
              background: isDragging ? 'var(--brand-teal-light)' : 'white',
              borderColor: isDragging ? 'var(--brand-teal)' : 'var(--border-focus)',
              border: '2px dashed var(--border-focus)', borderRadius: 'var(--radius-lg)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)'
            }}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud className="upload-icon" size={48} style={{ color: 'var(--brand-teal)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Ajouter un nouveau modèle (.pptx)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Glissez-déposez votre fichier ici, ou cliquez pour parcourir.<br />La miniature sera extraite automatiquement !</p>
          </div>

          <div className="templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            {templates.map(tpl => (
              <div key={tpl.id} className={`card ${activeTemplate === tpl.filename ? 'active' : ''}`} style={{
                border: `2px solid ${activeTemplate === tpl.filename ? 'var(--brand-teal)' : 'var(--border-light)'}`,
                display: 'flex', flexDirection: 'column', position: 'relative',
                boxShadow: activeTemplate === tpl.filename ? '0 0 0 4px var(--brand-teal-light)' : 'var(--shadow-sm)'
              }}>
                {activeTemplate === tpl.filename && (
                  <div className="active-badge" style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--brand-teal)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Actif
                  </div>
                )}

                <img src={tpl.thumbnail || '/template_thumb.jpg'} alt={tpl.filename} className="template-thumb" style={{ width: '100%', height: '180px', objectFit: 'contain', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }} />

                <div className="template-info" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  <h3 className="template-name" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-all' }}>
                    {tpl.filename}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      className={activeTemplate === tpl.filename ? "btn-secondary" : "btn-outline"}
                      onClick={() => handleSetDefault(tpl.filename)}
                      style={{
                        padding: '0.8rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500, flex: 1,
                        border: activeTemplate === tpl.filename ? '1px solid var(--border-light)' : '1px solid var(--brand-teal)',
                        background: activeTemplate === tpl.filename ? 'var(--bg-subtle)' : 'white',
                        color: activeTemplate === tpl.filename ? 'var(--text-muted)' : 'var(--brand-teal)',
                        cursor: activeTemplate === tpl.filename ? 'default' : 'pointer'
                      }}
                    >
                      {activeTemplate === tpl.filename ? 'Défaut' : 'Définir comme défaut'}
                    </button>
                    {tpl.filename !== 'BioProfile_OFF.pptx' && (
                      <button
                        className="btn-outline"
                        onClick={() => handleDeleteTemplate(tpl.filename)}
                        style={{
                          padding: '0.8rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500,
                          border: '1px solid #ef4444', color: '#ef4444', background: 'white'
                        }}
                        title="Supprimer ce modèle"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="guide-section" style={{ marginTop: '4rem', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              <Info size={24} style={{ color: 'var(--brand-teal)' }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Comment préparer un modèle PPTX personnalisé ?</h3>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              L'intelligence artificielle utilise un système de <strong>balises (tags)</strong> pour injecter automatiquement les informations extraites dans votre modèle PowerPoint. Cliquez sur une balise pour la copier, puis collez-la dans une zone de texte PowerPoint.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>Textes Simples</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)', lineHeight: 2 }}>
                  <li><CopyableTag tag="{{NOM}}" /> Nom complet</li>
                  <li><CopyableTag tag="{{TITRE}}" /> Titre professionnel</li>
                  <li><CopyableTag tag="{{DISPO}}" /> Disponibilité</li>
                  <li><CopyableTag tag="{{EMAIL}}" /> Email</li>
                  <li><CopyableTag tag="{{TELEPHONE}}" /> Téléphone</li>
                  <li><CopyableTag tag="{{LIENS}}" /> Liens web</li>
                </ul>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>Listes à Puces</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}><i>Appliquez le style "Puces" de PowerPoint directement sur la balise. Le style (couleur, puce) sera dupliqué intelligemment.</i></p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)', lineHeight: 2 }}>
                  <li><CopyableTag tag="{{HARD}}" /> Compétences tech.</li>
                  <li><CopyableTag tag="{{SOFT}}" /> Soft skills</li>
                  <li><CopyableTag tag="{{OUTILS}}" /> Outils logiciels</li>
                  <li><CopyableTag tag="{{LANGUES}}" /> Langues</li>
                  <li><CopyableTag tag="{{FORMATIONS}}" /> Formations</li>
                </ul>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>Expériences & Photo</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)', lineHeight: 2 }}>
                  <li><CopyableTag tag="{{PROJET_TITRE}}" /> Titre de l'expérience</li>
                  <li><CopyableTag tag="{{PROJET_DESC}}" /> Puces de description</li>
                  <li style={{ marginTop: '0.5rem' }}><CopyableTag tag="{{PHOTO}}" /> <i>Tracez un rectangle, et écrivez cette balise à l'intérieur.</i></li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}
