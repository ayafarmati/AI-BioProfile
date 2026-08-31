import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scan, Home, Clock, Plus, Check, FileText, BookOpen } from 'lucide-react';

export default function AppHeader({ activeStep }) {
  const location = useLocation();
  const path = location.pathname;

  const getPillClass = (step) => step === activeStep ? 'active' : '';
  const getCircleClass = (step) => {
    if (step === activeStep) return 'active';
    if (step < activeStep) return 'completed';
    return '';
  };

  return (
    <>
      <nav className="top-navbar">
        <div className="logo-container">
          <Link to="/">
            <img src="/logo.png" alt="SEGULA Technologies" style={{ height: '80px', objectFit: 'contain', filter: 'brightness(0) drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
          </Link>
        </div>
        
        <div className="navbar-title">
          AI BioProfile
        </div>
        
        <div className="navbar-nav">
          <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}><Home size={18} /> Accueil</Link>
          <Link to="/recent" className={`nav-item ${path === '/recent' ? 'active' : ''}`}><Clock size={18} /> Historique</Link>
          <Link to="/templates" className={`nav-item ${path === '/templates' ? 'active' : ''}`}><FileText size={18} /> Modèles PPT</Link>
          <Link to="/guide" className={`nav-item ${path === '/guide' ? 'active' : ''}`}><BookOpen size={18} /> Guide</Link>
          <Link to="/upload" className="btn-primary" style={{marginLeft: '1rem'}}><Plus size={18} /> Nouveau profil</Link>
        </div>
      </nav>
      
      {activeStep && (
        <div className="step-circles-container">
          <div className="step-circles">
            <div className={`circle-item ${getCircleClass(1)}`}>
              <div className="circle">{1 < activeStep ? <Check size={16} /> : 1}</div>
              <span>Upload</span>
            </div>
            <div className="circle-line"></div>
            <div className={`circle-item ${getCircleClass(2)}`}>
              <div className="circle">{2 < activeStep ? <Check size={16} /> : 2}</div>
              <span>Traitement IA</span>
            </div>
            <div className="circle-line"></div>
            <div className={`circle-item ${getCircleClass(3)}`}>
              <div className="circle">{3 < activeStep ? <Check size={16} /> : 3}</div>
              <span>BioProfile</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
