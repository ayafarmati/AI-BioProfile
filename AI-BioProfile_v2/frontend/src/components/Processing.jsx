import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, CheckCircle2, AlertCircle, Clock, ExternalLink, FileText, Activity } from 'lucide-react';

export default function Processing() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [batchStatus, setBatchStatus] = useState(null);
  const [fileCount, setFileCount] = useState(1);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/batch-status/${jobId}`);
        const statusData = response.data;
        setBatchStatus(statusData);
        
        const keys = Object.keys(statusData.files);
        setFileCount(keys.length);
        
        if (statusData.status === 'done') {
          clearInterval(pollInterval);
          if (keys.length === 1) {
            const singleFileStatus = statusData.files[keys[0]];
            if (singleFileStatus.status === 'done' && singleFileStatus.result) {
              setTimeout(() => {
                const profileFilename = singleFileStatus.result.replace('profiles/', '');
                navigate(`/bioprofiles/${profileFilename}`);
              }, 1500);
            }
          }
        }
      } catch (err) {
        clearInterval(pollInterval);
        setBatchStatus({ status: 'error', message: "Impossible de récupérer l'état du traitement." });
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, navigate]);

  const handleCancel = async () => {
    try {
      await axios.post(`/api/batch-cancel/${jobId}`);
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de l'annulation", error);
      navigate('/');
    }
  };

  const files = batchStatus && batchStatus.files ? Object.keys(batchStatus.files).map(k => ({ name: k, ...batchStatus.files[k] })) : [];
  
  const isFinished = batchStatus?.status === 'done' || batchStatus?.status === 'error';
  const isBatchSuccess = files.length > 0 && files.every(f => f.status === 'done');
  const hasError = files.some(f => f.status === 'error') || batchStatus?.status === 'error';
  const singleFileErrorMsg = files.length === 1 && files[0].status === 'error' ? files[0].message : batchStatus?.message || null;


  return (
    <div className="dashboard-layout fade-in">
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div className="upload-step-label" style={{ color: 'var(--brand-teal)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '1px' }}>ÉTAPE 2 SUR 3</div>
          <h1 className="page-title" id="procTitle">
            {isFinished ? (hasError ? 'Erreur lors de l\'analyse' : 'Analyse Terminée') : 'Analyse en cours...'}
          </h1>
          <p className="subtitle" id="procSubtitle" style={{ marginBottom: '2rem' }}>
            {isFinished 
              ? (hasError ? singleFileErrorMsg || 'Une erreur s\'est produite durant le traitement.' : (fileCount === 1 ? 'Redirection vers votre BioProfile...' : 'Tous les CVs ont été traités avec succès.')) 
              : 'L\'IA analyse et structure méticuleusement vos documents. Cette opération complexe peut prendre quelques minutes par CV.'}
          </p>
          
          <div className="card">
          {fileCount <= 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '380px', margin: '0 auto', textAlign: 'left', background: 'var(--bg-subtle)', padding: '2.5rem', borderRadius: 'var(--radius-xl)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div className={!isFinished ? "ai-pulse-orb" : ""} style={isFinished ? (hasError ? { width: '80px', height: '80px', borderRadius: '50%', background: 'var(--error-bg)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' } : { width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }) : {}}>
                  {isFinished ? (hasError ? <AlertCircle size={40} /> : <CheckCircle2 size={40} />) : <Activity size={32} />}
                </div>
              </div>

              {hasError && fileCount === 1 ? (
                <div style={{ textAlign: 'center' }}>
                   <button className="btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative' }}>
                  {/* Vertical line connecting steps */}
                  <div style={{ position: 'absolute', left: '15px', top: '16px', bottom: '16px', width: '2px', background: 'var(--border-light)', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '15px', top: '16px', width: '2px', background: 'var(--success)', zIndex: 1, height: isBatchSuccess ? 'calc(100% - 32px)' : '50%', transition: 'height 1s ease' }}></div>
  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 4px var(--bg-subtle)' }}>
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>Lecture du document</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 4px var(--bg-subtle)' }}>
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>Extraction structurée</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isBatchSuccess ? 'var(--success)' : 'white', border: isBatchSuccess ? 'none' : '2px solid var(--brand-teal)', color: isBatchSuccess ? 'white' : 'var(--brand-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 4px var(--bg-subtle)' }}>
                      {isBatchSuccess ? <Check size={16} strokeWidth={3} /> : <div className="circular-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'var(--brand-teal)', borderColor: 'rgba(14,124,134,0.2)' }}></div>}
                    </div>
                    <span style={{ fontWeight: 600, color: isBatchSuccess ? 'var(--text-main)' : 'var(--brand-teal)', fontSize: '1.05rem' }}>
                      {isBatchSuccess ? 'Génération BioProfile' : 'Analyse sémantique (IA)...'}
                    </span>
                  </div>
                </div>
              )}
              
              {!isFinished && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                   <button className="btn-outline" onClick={handleCancel} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>Annuler l'analyse</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '1rem', width: '100%' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-navy)', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'left', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>État d'avancement des documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', transition: 'var(--transition)', boxShadow: f.status === 'processing' ? '0 0 0 2px var(--brand-teal-light)' : 'none' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--brand-navy)', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                      <FileText size={18} style={{ color: 'var(--text-muted)', marginRight: '0.75rem' }} />
                      <span style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '600', padding: '0.4rem 0.8rem', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '0.4rem', 
                        background: f.status === 'done' ? 'var(--success-bg)' : f.status === 'error' ? 'var(--error-bg)' : f.status === 'processing' ? 'var(--brand-teal-light)' : 'var(--bg-subtle)',
                        color: f.status === 'done' ? 'var(--success)' : f.status === 'error' ? 'var(--error)' : f.status === 'processing' ? 'var(--brand-teal)' : 'var(--text-muted)'
                      }}>
                        {f.status === 'done' && <CheckCircle2 size={14} />}
                        {f.status === 'error' && <AlertCircle size={14} />}
                        {f.status === 'processing' && <div className="circular-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderColor: 'rgba(14, 124, 134, 0.2)', borderTopColor: 'var(--brand-teal)' }}></div>}
                        {f.status === 'pending' && <Clock size={14} />}
                        {f.status === 'done' ? 'Terminé' : f.status === 'processing' ? 'Analyse...' : f.status === 'error' ? 'Erreur' : 'En attente'}
                      </span>
                      {f.status === 'done' && f.result && (
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          onClick={() => window.open(`/#/bioprofiles/${f.result.replace('profiles/', '')}`, '_blank')}
                        >
                          Éditer <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {!isFinished && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                   <button className="btn-outline" onClick={handleCancel} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>Annuler le traitement global</button>
                </div>
              )}
              
              {isFinished && (
                <button className="btn-primary" onClick={() => navigate('/recent')} style={{marginTop: '2rem', width: '100%'}}>
                  Voir les profils générés
                </button>
              )}
            </div>
          )}
          
          {hasError && (
            <div id="procError" className="error-alert" style={{marginTop: '1.5rem'}}>
              {batchStatus?.message || "Une erreur s'est produite lors du traitement."}
            </div>
          )}
          
          {hasError && (
            <button className="btn-primary" onClick={() => navigate('/upload')} style={{marginTop: '1.5rem', width: '100%'}}>
              Réessayer
            </button>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
