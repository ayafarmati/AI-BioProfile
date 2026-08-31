import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, FileText, BookOpen, Plus } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="global-sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="AIBioProfile" />
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className={`sidebar-item ${path === '/' ? 'active' : ''}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/upload" className={`sidebar-item ${path === '/upload' ? 'active' : ''}`}>
          <Plus size={20} />
          <span>Nouveau Profil</span>
        </Link>
        <Link to="/recent" className={`sidebar-item ${path.startsWith('/recent') || path.startsWith('/bioprofiles') ? 'active' : ''}`}>
          <Clock size={20} />
          <span>Historique</span>
        </Link>
        <Link to="/templates" className={`sidebar-item ${path === '/templates' ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Modèles PPT</span>
        </Link>
        <Link to="/guide" className={`sidebar-item ${path === '/guide' ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Guide</span>
        </Link>
      </nav>
    </aside>
  );
}
