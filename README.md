# AI-BioProfile Generator

AI-BioProfile est une application web intelligente permettant d'automatiser l'extraction d'informations à partir de Curriculum Vitae (CV) non structurés (PDF, DOCX, TXT) et de générer dynamiquement des dossiers de compétences standardisés sous format PowerPoint (.pptx).

Ce projet a été développé dans le cadre d'un Projet de Fin d'Année (PFA) chez SEGULA Technologies. Il met un point d'honneur sur la **confidentialité des données** en utilisant exclusivement des modèles d'Intelligence Artificielle exécutés localement (*On-Premise*).

## 🚀 Fonctionnalités Principales

- **Extraction Multimodale** : Support des documents natifs (via `pymupdf4llm`) et des documents scannés/images via Reconnaissance Optique de Caractères (Tesseract OCR).
- **Analyse Sémantique Locale** : Utilisation de modèles de langage (LLM) quantifiés via **Ollama** (modèle recommandé : `qwen2.5:3b`) pour comprendre et extraire intelligemment les compétences, expériences, outils et formations.
- **Validation *Human-in-the-loop*** : Interface utilisateur permettant aux recruteurs de relire, modifier et valider les données JSON extraites avant la génération du document final.
- **Génération Dynamique de PPTX** : Injection automatique des données validées et de la photo de profil (recadrée via OpenCV) dans un gabarit PowerPoint (Template) respectant la charte graphique de l'entreprise.
- **Gestion des Profils & Templates** : Historique des profils extraits, gestion des templates PowerPoint dynamiques.

## 🛠️ Architecture Technique

- **Backend** : Python 3.10+, FastAPI, Uvicorn, Pydantic (validation de schémas)
- **Frontend** : React.js, Vite
- **IA & NLP** : Ollama (LLM local), Tesseract OCR, PyMuPDF, OpenCV (détection de visage)
- **Manipulation Documentaire** : `python-pptx` (génération), `python-docx` (lecture)

## ⚙️ Prérequis

Assurez-vous d'avoir installé les éléments suivants sur votre machine :
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js & npm](https://nodejs.org/) (pour le frontend React)
- [Tesseract OCR](https://tesseract-ocr.github.io/tessdoc/Installation.html) (assurez-vous qu'il est ajouté au PATH)
- [Ollama](https://ollama.com/) (pour faire tourner le LLM localement)

## 📥 Installation

### 1. Cloner le dépôt
```bash
git clone https://github.com/ayafarmati/AI-BioProfile.git
cd AI-BioProfile
```

### 2. Configuration du Backend (FastAPI)
```bash
# Créer un environnement virtuel
python -m venv venv

# L'activer (Sur Windows) :
venv\Scripts\activate
# L'activer (Sur Linux/Mac) :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Configuration de l'Intelligence Artificielle (Ollama)
Assurez-vous que l'application Ollama est lancée sur votre machine, puis téléchargez le modèle requis :
```bash
ollama run qwen2.5:3b
```
*(Le modèle utilisé peut être modifié dans le code source ou via variables d'environnement)*

### 4. Configuration du Frontend (React)
```bash
cd frontend
npm install
```

## 🚀 Lancement de l'application

Pour faire tourner le projet en environnement de développement, vous devez lancer le backend et le frontend simultanément.

**Terminal 1 : Lancer le Backend FastAPI**
```bash
# Assurez-vous d'être à la racine du projet et que le venv est activé
python app.py
# Le backend sera accessible sur http://localhost:8080
```

**Terminal 2 : Lancer le Frontend React**
```bash
cd frontend
npm run dev
# Le frontend sera accessible sur http://localhost:5173
```

## 📁 Structure du Projet

```text
AI-BioProfile/
├── app.py                            # Point d'entrée du backend FastAPI
├── extraction_ollama_markdown.py     # Logique d'extraction (OCR + Appel Ollama)
├── generate_pptx_v3.py               # Générateur de documents PowerPoint dynamique
├── requirements.txt                  # Dépendances Python
├── frontend/                         # Code source de l'interface React
├── templates/                        # Modèles PPTX de base
├── profiles/                         # Sauvegarde des profils JSON validés
├── uploads/                          # Fichiers CV temporaires uploadés
└── static/                           # Assets et images temporaires (ex: photos de profil)
```

## 🤝 Crédits
Projet de fin d'année réalisé par **Aya Farmati** et **Mouaki Maryame** au sein de SEGULA Technologies.
