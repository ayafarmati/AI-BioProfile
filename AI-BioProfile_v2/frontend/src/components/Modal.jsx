import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Modal({ isOpen, onClose, onConfirm, title, message, type = 'confirm', confirmText = 'Confirmer', cancelText = 'Annuler' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-surface)', width: '100%', maxWidth: '400px',
        borderRadius: 'var(--radius-xl)', padding: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem', 
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'
          }}
        >
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: type === 'danger' ? 'var(--error-bg)' : (type === 'alert' ? 'var(--bg-subtle)' : 'var(--brand-teal-light)'),
            color: type === 'danger' ? 'var(--error)' : (type === 'alert' ? 'var(--warning, #f59e0b)' : 'var(--brand-teal)')
          }}>
            {type === 'danger' || type === 'alert' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--brand-navy)' }}>{title}</h3>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {type !== 'alert' && (
            <button className="btn-cancel" onClick={onClose} style={{ padding: '0.6rem 1.2rem' }}>
              {cancelText}
            </button>
          )}
          <button 
            className="btn-primary" 
            onClick={() => { onConfirm && onConfirm(); onClose(); }}
            style={{ 
              padding: '0.6rem 1.2rem',
              background: type === 'danger' ? 'var(--error)' : 'var(--brand-teal)',
              boxShadow: type === 'danger' ? '0 4px 10px rgba(239,68,68,0.2)' : ''
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
