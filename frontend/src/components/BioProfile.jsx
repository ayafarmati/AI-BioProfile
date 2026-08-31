import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, RefreshCw, Loader2, MapPin, AlertTriangle, 
  CheckCircle2, User, Briefcase, Plus, GraduationCap, Code, Languages, Trash2, GripVertical, Settings, Undo2,
  Mail, Phone, Link
} from 'lucide-react';
import Modal from './Modal';

function InlineEdit({ value, field, onSave, multiline = false, placeholder = "Non renseigné", customClass = "" }) {
  const isArray = Array.isArray(value);
  const initialValue = isArray ? value.join('\n') : (value || '');
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(initialValue);

  useEffect(() => {
    setCurrentValue(isArray ? (value || []).join('\n') : (value || ''));
  }, [value, isArray]);

  if (isEditing) {
    return (
      <div className={`inline-editable ${customClass}`}>
        <div className="inline-edit">
          {multiline ? (
            <textarea 
              className="field-textarea" 
              value={currentValue} 
              onChange={(e) => setCurrentValue(e.target.value)} 
              rows={isArray ? Math.max(3, (value || []).length + 1) : 4}
            />
          ) : (
            <input 
              type="text" 
              className="field-input" 
              value={currentValue} 
              onChange={(e) => setCurrentValue(e.target.value)} 
            />
          )}
          <div className="edit-actions">
            <button className="btn-small btn-cancel" onClick={() => {
              setCurrentValue(initialValue);
              setIsEditing(false);
            }}>Annuler</button>
            <button className="btn-small btn-save" onClick={() => {
              const valToSave = isArray ? currentValue.split('\n').filter(s => s.trim()) : currentValue;
              onSave(field, valToSave);
              setIsEditing(false);
            }}>Sauvegarder</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-editable ${customClass}`} onClick={() => setIsEditing(true)}>
      <div className="inline-view">
        {isArray && value && value.length > 0 ? (
          <ul style={{margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)'}}>
            {value.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        ) : (!isArray && value && value !== "Candidat Inconnu" && value !== "Profil Général" && value !== "Expérience ou Projet") ? (
          multiline ? value.split('\n').map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>) : value
        ) : (
          <span style={{color: '#ef4444', fontWeight: '600', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #fca5a5'}}>
            ⚠️ {placeholder} (Manquant)
          </span>
        )}
      </div>
    </div>
  );
}

function InlineListEdit({ items, field, onSave, badgeClass="skill-badge" }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentItems, setCurrentItems] = useState(items || []);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setCurrentItems(items || []);
  }, [items]);

  const handleRemove = (idx) => {
    const updated = currentItems.filter((_, i) => i !== idx);
    setCurrentItems(updated);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      setCurrentItems([...currentItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleSave = () => {
    onSave(field, currentItems);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={{background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem'}}>
          {currentItems.map((item, idx) => (
            <span key={idx} className={badgeClass} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.5rem'}}>
              {item}
              <Trash2 size={14} style={{cursor: 'pointer', opacity: 0.7}} onClick={() => handleRemove(idx)} />
            </span>
          ))}
        </div>
        <form onSubmit={handleAdd} style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
          <input 
            type="text" 
            value={newItem} 
            onChange={e => setNewItem(e.target.value)} 
            placeholder="Ajouter un élément..." 
            style={{flex: 1, padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '4px'}}
          />
          <button type="submit" style={{padding: '0.5rem 1rem', background: 'var(--brand-teal)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            Ajouter
          </button>
        </form>
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem'}}>
          <button onClick={() => {setCurrentItems(items || []); setIsEditing(false)}} className="btn-small btn-cancel">Annuler</button>
          <button onClick={handleSave} className="btn-small btn-save">Sauvegarder</button>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-container" onClick={() => setIsEditing(true)} style={{cursor: 'pointer', minHeight: '30px', padding: '0.5rem', border: '1px dashed transparent'}}>
      <div className="hover-edit-indicator" style={{display: 'none'}}>✏️ Modifier</div>
      {(items || []).length > 0 ? (
        (items || []).map((s, i) => <span key={i} className={badgeClass}>{s}</span>)
      ) : (
        <span style={{color: '#ef4444', fontWeight: '600', background: '#fee2e2', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #fca5a5', display: 'inline-block'}}>
          ⚠️ Manquant - Cliquer pour ajouter
        </span>
      )}
    </div>
  );
}

export default function BioProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [generating, setGenerating] = useState(false);
  const [template, setTemplate] = useState(() => {
    return localStorage.getItem('default_template') || 'BioProfile_OFF.pptx';
  });
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(45);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = React.useRef(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (options) => setModalConfig({ ...options, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setPdfWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while resizing
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = 'auto';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const fetchProfileAndTemplates = async () => {
      try {
        const [profileRes, templatesRes] = await Promise.all([
          axios.get(`/api/profiles/${id}`),
          axios.get('/api/templates').catch(() => ({ data: [] }))
        ]);
        setProfile(profileRes.data);
        
        const apiTemplates = templatesRes.data.map(t => t.filename);
        if (!apiTemplates.includes('BioProfile_OFF.pptx')) {
          apiTemplates.unshift('BioProfile_OFF.pptx');
        }
        if (!apiTemplates.includes('BioProfile_Generated.pptx')) {
          apiTemplates.push('BioProfile_Generated.pptx');
        }
        setAvailableTemplates(apiTemplates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndTemplates();
  }, [id]);

  const handleSave = async (field, val) => {
    setHistory(prev => [...prev, profile]);
    const updated = { ...profile, [field]: val };
    setProfile(updated);
    setSaving(true);
    try {
      await axios.put(`/api/profiles/${id}`, updated);
      setToastMsg('Modifications enregistrées');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e) {
      showModal({ title: "Erreur", message: "Erreur de sauvegarde", type: "alert", confirmText: "Fermer" });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setProfile(previousState);
    setSaving(true);
    try {
      await axios.put(`/api/profiles/${id}`, previousState);
      setToastMsg('Dernière modification annulée');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e) {
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    showModal({
      title: "Réinitialiser le profil",
      message: "Voulez-vous vraiment annuler TOUTES vos modifications et revenir à l'état initial après l'extraction IA ?",
      type: "danger",
      confirmText: "Oui, réinitialiser",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await axios.post(`/api/profiles/${id}/reset`);
          setProfile(res.data);
          setHistory([]);
          setToastMsg('Profil réinitialisé à l\'état d\'origine');
          setTimeout(() => setToastMsg(''), 3000);
        } catch (e) {
          showModal({ title: "Erreur", message: "Impossible de réinitialiser. Le fichier d'origine n'existe pas ou il y a eu une erreur.", type: "alert", confirmText: "Fermer" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleExpSave = (index, subfield, val) => {
    const arr = [...(profile.experiences || [])];
    if (arr[index]) {
      arr[index][subfield] = val;
      handleSave('experiences', arr);
    }
  };

  const addExperience = () => {
    const arr = [{titre_experience: 'Nouvelle Expérience', details_experience: []}, ...(profile.experiences || [])];
    handleSave('experiences', arr);
  };

  const deleteExperience = (index) => {
    showModal({
      title: "Supprimer l'expérience",
      message: "Voulez-vous vraiment supprimer cette expérience ?",
      type: "danger",
      confirmText: "Supprimer",
      onConfirm: () => {
        const arr = profile.experiences.filter((_, i) => i !== index);
        handleSave('experiences', arr);
      }
    });
  };

  const generatePpt = async () => {
    setGenerating(true);
    try {
      const payload = { ...profile, template };
      const res = await axios.post('/api/generate-ppt', payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BioProfile_${profile.nom_complet ? profile.nom_complet.replace(/\\s+/g, '_') : 'Generated'}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      showModal({ title: "Erreur", message: "Erreur lors de la génération du PPT.", type: "alert", confirmText: "Fermer" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setSaving(true);
    try {
      const res = await axios.post(`/api/upload-photo/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, photo_path: res.data.photo_path }));
    } catch (err) {
      showModal({ title: "Erreur", message: "Erreur lors de l'upload de la photo.", type: "alert", confirmText: "Fermer" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container fade-in">

        <main className="main-content">
          <div style={{display:'flex', justifyContent:'center', padding:'4rem'}}>
            <Loader2 className="animate-spin" size={48} style={{color:'var(--teal-500)'}} />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container fade-in">
        <main className="main-content">
          <div style={{color:'red', padding:'2rem', textAlign:'center'}}>Erreur: Profil introuvable</div>
        </main>
      </div>
    );
  }

  let filledFields = 0;
  const totalFields = 8;
  if (profile.nom_complet) filledFields++;
  if (profile.titre_professionnel) filledFields++;
  if (profile.autres_informations) filledFields++;
  if (profile.experiences && profile.experiences.length > 0) filledFields++;
  if (profile.technical_skills && profile.technical_skills.length > 0) filledFields++;
  if (profile.soft_skills && profile.soft_skills.length > 0) filledFields++;
  if (profile.tools && profile.tools.length > 0) filledFields++;
  if (profile.langues && profile.langues.length > 0) filledFields++;
  const completeness = Math.round((filledFields / totalFields) * 100);

  const initials = profile.nom_complet ? profile.nom_complet.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
  const missingInfoText = (profile.missing_fields && profile.missing_fields.length > 0) ? `${profile.missing_fields.length} informations manquantes` : "Profil complet";

  return (
    <div className="profile-container fade-in" style={{ maxWidth: showPdf ? '98%' : 'var(--max-width)' }}>
      <main className="main-content" style={{ 
        maxWidth: '100%', 
        display: 'flex', 
        gap: '2rem', 
        flexDirection: showPdf ? 'row' : 'column',
        padding: '2rem',
        alignItems: 'flex-start'
      }}>
        
        {/* PDF Viewer Pane */}
        {showPdf && profile.pdf_path && (
          <>
            <div style={{ width: `${pdfWidth}%`, minWidth: '300px', height: 'calc(100vh - 120px)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'sticky', top: '2rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--brand-navy)' }}>CV Original</h3>
                <button className="btn-small btn-cancel" onClick={() => setShowPdf(false)}>Fermer</button>
              </div>
              <iframe src={profile.pdf_path} width="100%" height="100%" style={{ border: 'none', flex: 1, pointerEvents: isResizing ? 'none' : 'auto' }} title="CV Original"></iframe>
            </div>

            {/* Resizer Handle */}
            <div 
              onMouseDown={() => setIsResizing(true)}
              style={{
                width: '12px',
                margin: '0 -6px',
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                position: 'sticky',
                top: 'calc(50vh - 20px)'
              }}
            >
              <div style={{ width: '4px', height: '40px', background: isResizing ? 'var(--brand-teal)' : 'var(--border-light)', borderRadius: '4px', transition: 'background 0.2s' }}></div>
            </div>
          </>
        )}

        {/* Editor Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '400px' }}>
          <div className="editor-action-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => navigate('/recent')}>
              <ArrowLeft size={18} /> Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {history.length > 0 && (
                <button className="btn-outline" onClick={handleUndo} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }} title="Annuler la dernière modification">
                  <Undo2 size={18} /> Annuler
                </button>
              )}
              <button className="btn-outline" onClick={handleReset} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }} title="Réinitialiser à l'extraction d'origine">
                <RefreshCw size={18} /> Réinitialiser
              </button>
              {profile.pdf_path && (
                <button className="btn-secondary" onClick={() => setShowPdf(!showPdf)}>
                  {showPdf ? "Masquer le CV" : "Vérifier avec le CV"}
                </button>
              )}
              {saving && (
              <span style={{color:'var(--brand-teal)', fontSize:'0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                <RefreshCw size={14} className="animate-spin" /> Sauvegarde...
              </span>
            )}
            <select style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }} value={template} onChange={e => setTemplate(e.target.value)}>
              {availableTemplates.map(tpl => (
                <option key={tpl} value={tpl}>{tpl}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={generatePpt} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {generating ? <><Loader2 size={18} className="animate-spin" /> Génération...</> : "Générer PPT"}
            </button>
          </div>
        </div>
        
        <div style={{display:'flex', flexDirection:'column', gap:'1.5rem', width:'100%'}}>
          {/* Hero Card */}
          <div className="profile-header-card">
            <div className="profile-avatar" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer', position: 'relative' }}>
              {profile.photo_path ? (
                <img src={profile.photo_path} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                initials
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '2px 0', borderBottomLeftRadius: '50%', borderBottomRightRadius: '50%' }}>
                Modifier
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
            
            <div className="hero-info" style={{ flex: 1 }}>
              <div style={{fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem'}}>
                <InlineEdit value={profile.nom_complet} field="nom_complet" onSave={handleSave} placeholder="Nom Complet" />
              </div>
              <div style={{color: 'var(--brand-teal-light)', fontWeight: 500, fontSize: '1.1rem'}}>
                <InlineEdit value={profile.titre_professionnel} field="titre_professionnel" onSave={handleSave} placeholder="Titre Professionnel" />
              </div>
              <div className="hero-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <span><MapPin size={16} /> Casablanca, Maroc</span>
                <span>
                  <InlineEdit value={profile.disponibilite} field="disponibilite" onSave={handleSave} placeholder="Disponibilité" />
                </span>
              </div>
              <div className="hero-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> <InlineEdit value={profile.email} field="email" onSave={handleSave} placeholder="Email" />
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} /> <InlineEdit value={profile.telephone} field="telephone" onSave={handleSave} placeholder="Téléphone" />
                </span>
              </div>
              {profile.liens && profile.liens.length > 0 && (
                <div className="hero-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {profile.liens.map((lien, idx) => (
                    <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Link size={14} /> <a href={lien.startsWith('http') ? lien : `https://${lien}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{lien}</a>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="hero-status">
              <span className="status-label">Statut</span>
              <span className="status-badge">Disponible</span>
            </div>
          </div>

          {/* Completeness Card */}
          <div className="profile-completeness-card">
            <span className="comp-label">Complétude du profil</span>
            <div className="comp-bar-container">
              <div className="comp-bar-fill" style={{width: `${completeness}%`}}></div>
            </div>
            <span className="comp-percent">{completeness}%</span>
            {profile.missing_fields && profile.missing_fields.length > 0 ? (
              <span className="comp-warning"><AlertTriangle size={16} /> {missingInfoText}</span>
            ) : (
              <span className="comp-success"><CheckCircle2 size={16} /> {missingInfoText}</span>
            )}
          </div>

          {/* Main Grid */}
          <div className="bio-grid">
            <div className="bio-column-left">
              


              <div className="bio-card">
                <div className="bio-card-header">
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><Briefcase size={18} /> Expérience</div>
                  <button className="btn-icon" onClick={addExperience}><Plus size={18} /></button>
                </div>
                <div className="bio-card-body">
                  {profile.experiences?.map((exp, idx) => (
                    <div key={idx} className="exp-item drag-item">
                      <div className="drag-handle"><GripVertical size={16} /></div>
                      <div style={{flex: 1}}>
                        <div className="exp-item-header">
                          <InlineEdit value={exp.titre_experience} field="titre_experience" onSave={(f, v) => handleExpSave(idx, f, v)} customClass="exp-title-edit" placeholder="Titre du poste" />
                          <button className="btn-delete" onClick={() => deleteExperience(idx)}><Trash2 size={16} /></button>
                        </div>
                        <InlineEdit value={exp.details_experience} field="details_experience" onSave={(f, v) => handleExpSave(idx, f, v)} multiline={true} customClass="exp-desc-edit" placeholder="Description de l'expérience" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bio-card">
                <div className="bio-card-header">
                  <User size={18} /> Autres Informations
                </div>
                <div className="bio-card-body">
                  <InlineEdit value={profile.autres_informations} field="autres_informations" onSave={handleSave} multiline={true} placeholder="Résumé du profil..." />
                </div>
              </div>

            </div>
            
            <div className="bio-column-right">
              
              <div className="bio-card">
                <div className="bio-card-header">
                  <Code size={18} /> Compétences Techniques
                </div>
                <div className="bio-card-body">
                  <InlineListEdit items={profile.technical_skills} field="technical_skills" onSave={handleSave} badgeClass="skill-badge" />
                </div>
              </div>
              
              <div className="bio-card">
                <div className="bio-card-header">
                  <Settings size={18} /> Outils
                </div>
                <div className="bio-card-body">
                  <InlineListEdit items={profile.tools} field="tools" onSave={handleSave} badgeClass="skill-badge outline" />
                </div>
              </div>

              <div className="bio-card">
                <div className="bio-card-header">
                  <User size={18} /> Soft Skills
                </div>
                <div className="bio-card-body">
                  <InlineListEdit items={profile.soft_skills} field="soft_skills" onSave={handleSave} badgeClass="skill-badge soft" />
                </div>
              </div>

              <div className="bio-card">
                <div className="bio-card-header">
                  <GraduationCap size={18} /> Formations
                </div>
                <div className="bio-card-body">
                  <InlineListEdit items={profile.formations} field="formations" onSave={handleSave} badgeClass="skill-badge outline" />
                </div>
              </div>

              <div className="bio-card">
                <div className="bio-card-header">
                  <Languages size={18} /> Langues
                </div>
                <div className="bio-card-body">
                  <InlineListEdit items={profile.langues} field="langues" onSave={handleSave} badgeClass="skill-badge" />
                </div>
              </div>
              
              {profile.missing_fields && profile.missing_fields.length > 0 && (
                <div className="bio-card warning-card">
                  <div className="bio-card-header warning">
                    <AlertTriangle size={18} /> Informations manquantes
                  </div>
                  <div className="bio-card-body">
                    <ul className="missing-list-simple">
                      {profile.missing_fields.map((m, i) => <li key={i}>- {m}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
      </main>
      <Modal {...modalConfig} onClose={closeModal} />
      {toastMsg && (
        <div className="toast-notification fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--brand-navy)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px rgba(10,37,64,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 100 }}>
          <CheckCircle2 size={20} style={{ color: 'var(--brand-teal-light)' }} />
          <span style={{ fontWeight: 500 }}>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
