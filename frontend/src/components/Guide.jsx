import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, UploadCloud, Edit3, LayoutTemplate, History, ChevronRight, ChevronLeft, Sparkles, Wand2 } from 'lucide-react';

export default function Guide() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'upload',
      title: 'Import & Analyse IA',
      icon: <UploadCloud size={24} />,
      content: (
        <div className="guide-content">
          <h3>Comment démarrer avec vos CVs ?</h3>
          <p>La première étape consiste à importer les CVs des candidats (formats PDF ou DOCX supportés).</p>
          <ul>
            <li>Allez sur la page <strong>Nouvelle Analyse</strong>.</li>
            <li>Glissez-déposez vos fichiers ou parcourez votre ordinateur.</li>
            <li>L'Intelligence Artificielle de SEGULA va extraire, nettoyer et structurer les données automatiquement.</li>
          </ul>
          <div className="guide-action">
            <button className="btn-primary" onClick={() => navigate('/upload')}>Essayer l'import maintenant</button>
          </div>
        </div>
      )
    },
    {
      id: 'editor',
      title: 'Éditeur de Profil',
      icon: <Edit3 size={24} />,
      content: (
        <div className="guide-content">
          <h3>Vérifier et ajuster les données extraites</h3>
          <p>Une fois l'extraction terminée, vous accédez à l'Éditeur de Profil. C'est ici que vous pouvez affiner les résultats.</p>
          <ul>
            <li><strong>Modification Rapide :</strong> Cliquez sur n'importe quel texte pour le modifier en direct.</li>
            <li><strong>Vérification PDF :</strong> Cliquez sur "Vérifier avec le CV" pour afficher le CV original côte à côte.</li>
            <li><strong>Annulation :</strong> Vous avez fait une erreur ? Utilisez les boutons <em>Annuler</em> ou <em>Réinitialiser</em> pour revenir en arrière.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'templates',
      title: 'Modèles & PPTX',
      icon: <LayoutTemplate size={24} />,
      content: (
        <div className="guide-content">
          <h3>Le système de balises intelligentes</h3>
          <p>Générez des présentations PowerPoint parfaitement formatées grâce aux modèles et balises.</p>
          <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem', border: '1px solid var(--border-light)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wand2 size={18} style={{ color: 'var(--brand-teal)' }}/> Comment ça marche ?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
              <li>Allez dans <strong>Modèles PPTX</strong> pour voir la liste des balises (ex: <code>{"{{NOM}}"}</code>, <code>{"{{HARD}}"}</code>).</li>
              <li>Ouvrez votre propre fichier PowerPoint et collez ces balises où vous voulez que les données apparaissent.</li>
              <li>L'IA remplacera automatiquement les balises en conservant <strong>votre style</strong> (police, couleur, puces).</li>
            </ul>
            <button className="btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/templates')}>Gérer les modèles</button>
          </div>
        </div>
      )
    },
    {
      id: 'history',
      title: 'Historique',
      icon: <History size={24} />,
      content: (
        <div className="guide-content">
          <h3>Retrouver vos profils générés</h3>
          <p>Tous les profils analysés sont sauvegardés localement.</p>
          <ul>
            <li>Retrouvez-les via l'onglet <strong>Historique</strong>.</li>
            <li>Filtrez par nom, poste ou compétence technique pour trouver rapidement le bon profil.</li>
            <li>Vous pouvez les rouvrir pour regénérer un PPT à tout moment.</li>
          </ul>
          <div className="guide-action">
            <button className="btn-primary" onClick={() => navigate('/recent')}>Voir mon historique</button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="dashboard-layout fade-in" style={{ background: 'var(--bg-main)' }}>
      
      <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-teal-light)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <BookOpen size={40} style={{ color: 'var(--brand-teal)' }} />
          </div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Guide d'Utilisation Interactif</h1>
          <p className="subtitle" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Apprenez à maîtriser AI BioProfile étape par étape pour automatiser la création de vos présentations.
          </p>
        </div>

        <div className="guide-container" style={{ display: 'flex', gap: '3rem', background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
          
          {/* Stepper Sidebar */}
          <div className="guide-sidebar" style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRight: '1px solid var(--border-light)', paddingRight: '2rem' }}>
            {steps.map((step, index) => (
              <button 
                key={step.id}
                onClick={() => setActiveStep(index)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', 
                  borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: activeStep === index ? 'var(--brand-teal-light)' : 'transparent',
                  color: activeStep === index ? 'var(--brand-teal)' : 'var(--text-secondary)',
                  fontWeight: activeStep === index ? 600 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ 
                  background: activeStep === index ? 'white' : 'var(--bg-subtle)', 
                  padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: activeStep === index ? 'var(--shadow-sm)' : 'none'
                }}>
                  {step.icon}
                </div>
                {step.title}
              </button>
            ))}
          </div>

          {/* Guide Content Area */}
          <div className="guide-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              {steps[activeStep].content}
            </div>
            
            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
              <button 
                className="btn-outline" 
                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: activeStep === 0 ? 0 : 1, pointerEvents: activeStep === 0 ? 'none' : 'auto' }}
              >
                <ChevronLeft size={18} /> Précédent
              </button>
              
              <button 
                className="btn-primary" 
                onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
                disabled={activeStep === steps.length - 1}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: activeStep === steps.length - 1 ? 0 : 1, pointerEvents: activeStep === steps.length - 1 ? 'none' : 'auto' }}
              >
                Suivant <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </div>

      </main>

      <style>{`
        .guide-content h3 {
          font-size: 1.5rem;
          color: var(--brand-navy);
          margin-bottom: 1rem;
        }
        .guide-content p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 1.05rem;
          margin-bottom: 1.5rem;
        }
        .guide-content ul {
          list-style: none;
          padding: 0;
          margin-bottom: 2rem;
        }
        .guide-content li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .guide-content li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--brand-teal);
          font-weight: bold;
        }
        .guide-action {
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
