# 🚀 AI Bio Profile Generator

Bienvenue sur **AI Bio Profile Generator**, l'outil RH de nouvelle génération développé pour standardiser et sublimer les profils de nos collaborateurs. 

Ce projet se distingue par sa **totale souveraineté des données** : 100% du traitement (lecture de CV, analyse IA, structuration) s'effectue en local. Les données RH sensibles ne quittent jamais votre machine. Le tout est présenté via une interface moderne, fluide et aux couleurs de Segula.

---

## 🏗️ Architecture du Pipeline (Les 3 Phases)

Le système est conçu autour de trois étapes clés pour transformer un document brut en présentation prête à l'emploi :

### Phase 1 : Ingestion et Prétraitement
Extraction des informations à partir du CV soumis (PDF ou Texte brut). Cette phase utilise :
- **PyMuPDF (`fitz`)** : Pour lire le texte structuré des PDF et extraire la photo de profil (médias/photos).
- **Tesseract OCR** : Pour récupérer le texte des documents scannés ou sous forme d'images.

### Phase 2 : Analyse IA (Extraction Sémantique)
Le texte extrait est envoyé à une intelligence artificielle locale pour structuration :
- Utilisation de **Ollama** avec le modèle `llama3.2:3b`.
- API locale pilotée par **FastAPI** (requêtes brutes, sans Pydantic/OpenAI pour le dialogue LLM).
- **JSON Dynamique** : L'IA identifie et regroupe intelligemment les informations clés telles que les *hard skills*, *soft skills*, *projets*, et *langues*.

### Phase 3 : Injection dans le Template
*(En cours de refonte)*
Les données JSON structurées seront automatiquement mappées et injectées dans un template de présentation (type PowerPoint), prêt à être partagé avec les clients.

---

## ⚙️ Prérequis (Prerequisites)

> ⚠️ **Attention** : Ollama doit tourner en arrière-plan sur votre machine avant de lancer le serveur, sinon l'IA ne pourra pas répondre.

Avant de commencer, assurez-vous d'avoir installé les éléments suivants sur votre environnement Windows :
- **Python 3.x** (assurez-vous qu'il est ajouté à votre variable d'environnement PATH).
- **Ollama** installé (téléchargeable depuis [ollama.com](https://ollama.com/)).
- Le modèle local téléchargé via Ollama :
  ```bash
  ollama run llama3.2:3b
  ```
- **Tesseract OCR** (Optionnel mais recommandé pour les PDF scannés).

---

## 🛠️ Installation (Setup)

Suivez ces étapes pour configurer le projet en local sous Windows :

1. **Cloner ou récupérer le projet** dans votre dossier de travail.
2. **Créer un environnement virtuel Python (`venv`) :**
   ```bash
   python -m venv venv
   ```
3. **Activer l'environnement virtuel :**
   ```bash
   .\venv\Scripts\activate
   ```
4. **Installer les dépendances requises :**
   ```bash
   pip install -r requirements.txt
   ```
   *(Si le fichier `requirements.txt` n'est pas encore créé, vous pouvez installer manuellement les paquets : `pip install fastapi uvicorn pydantic python-multipart requests pymupdf pytesseract pillow`)*

---

## 🚀 Démarrage (Usage)

Une fois l'installation terminée et Ollama en cours d'exécution, lancez le serveur backend depuis la racine du projet :

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Accédez ensuite à l'interface web en ouvrant cette URL dans votre navigateur :  
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 📁 Structure du Projet (Folder Structure)

Voici l'arborescence principale du projet et le rôle de chaque fichier :

```text
projet PFA/
│
├── app.py                  # Point d'entrée de l'API (FastAPI). Gère les routes, le serveur et l'orchestration.
├── test_extraction.py      # Cœur de la logique : fonctions OCR, PyMuPDF et requêtes LLM vers Ollama.
│
└── static/                 # Dossier contenant les ressources du Frontend
    ├── index.html          # L'interface utilisateur web (Drag & Drop, affichage de la validation).
    ├── style.css           # Feuille de style (design moderne, branding Segula, animations).
    └── script.js           # Logique côté client (appels API, UI dynamique).
