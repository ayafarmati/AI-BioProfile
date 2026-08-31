import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CloudUpload, FolderOpen, FileText, CheckCircle2, AlertCircle, Wand2, ShieldCheck, Lock, UserCheck, Plus } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

  const validateFile = (f) => {
    if (!validTypes.includes(f.type)) {
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(validateFile);
    
    if (validFiles.length !== selectedFiles.length) {
      setError("Certains fichiers ont été ignorés car ils ne sont pas au format PDF, DOCX ou TXT.");
    } else {
      setError('');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(validateFile);
    
    if (validFiles.length !== droppedFiles.length) {
      setError("Certains fichiers ont été ignorés (format non supporté).");
    } else {
      setError('');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };
  
  const removeFile = (indexToRemove, e) => {
    e.stopPropagation();
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    setIsExtracting(true);
    setError('');
    
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const response = await axios.post('/api/extract-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/processing/${response.data.job_id}`);
    } catch (err) {
      setError("Une erreur s'est produite lors de la connexion au serveur.");
      setIsExtracting(false);
    }
  };

  return (
    <div className="dashboard-layout fade-in">
      
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div className="upload-step-label" style={{ color: 'var(--brand-teal)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '1px' }}>ÉTAPE 1 SUR 3</div>
          <h1 className="page-title">Importer un CV</h1>
          <p className="subtitle" style={{ marginBottom: '2rem' }}>L'IA extrait automatiquement l'expérience, les compétences et la formation du candidat.</p>
          
          <div 
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx,.txt" 
              multiple
              onChange={handleFileChange} 
            />
            
            {files.length === 0 ? (
              <div className="drop-content">
                <div className="upload-icon-wrapper">
                  <CloudUpload className="upload-icon" size={48} />
                </div>
                <h3 className="drop-text-main">Glissez-déposez votre CV ici</h3>
                <p className="drop-text-sub">ou sélectionnez un fichier depuis votre ordinateur</p>
                <button className="btn-choose-file" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
                  <FolderOpen size={18} /> Choisir un fichier
                </button>
                <div className="file-formats">
                  <span className="format-badge">PDF</span>
                  <span className="format-badge">DOCX</span>
                  <span className="format-badge">TXT</span>
                  <span className="format-size">- 10 Mo max</span>
                </div>
              </div>
            ) : (
              <div className="files-selected" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}</h3>
                  <button className="btn-choose-file" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Ajouter
                  </button>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {files.map((f, i) => (
                    <div key={i} className="file-selected" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', margin: 0, cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <FileText className="file-icon" style={{color: 'var(--teal-500)'}} size={24} />
                        <div className="file-info" style={{ textAlign: 'left' }}>
                          <p className="file-name" style={{ fontSize: '0.9rem', marginBottom: '0.1rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                          <p className="file-size" style={{ fontSize: '0.75rem' }}>{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={(e) => removeFile(i, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="upload-actions" style={{ marginTop: '2rem' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              disabled={files.length === 0 || isExtracting}
              onClick={handleExtract}
            >
              <Wand2 size={20} /> {isExtracting ? 'En cours d\'extraction...' : (files.length > 1 ? `Extraire les ${files.length} CVs` : 'Extraire les informations')}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} style={{color: 'var(--brand-teal)'}} /> Traitement sécurisé
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} style={{color: 'var(--brand-teal)'}} /> Données confidentielles
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} style={{color: 'var(--brand-teal)'}} /> Validation humaine
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
