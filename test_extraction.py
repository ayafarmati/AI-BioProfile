import json
import urllib.request
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os

# Définir le chemin par défaut de l'exécutable Tesseract sous Windows
TESSERACT_DEFAULT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_DEFAULT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_DEFAULT_PATH

def perform_ocr_on_pdf(doc) -> str:
    """
    Parcourt les pages du document PDF, les convertit en images (pixmap)
    avec PyMuPDF, puis applique Tesseract OCR pour extraire le texte.
    """
    text = ""
    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Utiliser un zoom de 150 DPI pour un bon compromis précision/rapidité
            zoom = 150 / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix)
            
            # Convertir le pixmap en octets PNG
            img_bytes = pix.tobytes("png")
            
            # Charger dans PIL
            img = Image.open(io.BytesIO(img_bytes))
            
            # Appliquer l'OCR en français et anglais
            page_text = pytesseract.image_to_string(img, lang="fra+eng")
            text += f"--- Page {page_num + 1} ---\n"
            text += page_text + "\n"
            print(f"OCR de la page {page_num + 1}/{len(doc)} terminé.")
    except Exception as e:
        print(f"Erreur lors de l'exécution de l'OCR : {e}")
        # Si Tesseract n'est pas installé ou configuré, lever une erreur explicite
        if "tesseract is not installed or it's not in your PATH" in str(e).lower() or "[Errno 2]" in str(e):
            raise RuntimeError(
                "Tesseract OCR n'est pas détecté sur votre système. "
                "Veuillez l'installer depuis https://github.com/UB-Mannheim/tesseract/wiki "
                "et vous assurer que 'tesseract.exe' est présent dans 'C:\\Program Files\\Tesseract-OCR\\' "
                "ou dans votre variable d'environnement PATH."
            )
        else:
            raise e
    return text

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extrait le texte brut d'un fichier PDF à partir de ses octets.
    Si le document est scanné (pas de texte natif extrait), applique l'OCR local.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
        
    # Si le texte extrait est extrêmement court (seuil de 150 caractères), on applique l'OCR
    if len(text.strip()) < 150 and len(doc) > 0:
        print("[WARNING] PDF scanne detecte (texte extrait insuffisant). Lancement de l'OCR local...")
        text = perform_ocr_on_pdf(doc)
        
    return text

def extract_image_from_pdf(file_bytes: bytes) -> bytes:
    """
    Parcourt les images du PDF et extrait la photo de profil probable en utilisant
    des critères de taille, d'aspect ratio et de position sur la page,
    tout en filtrant les fonds de page et les icônes.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if len(doc) == 0:
            return None
            
        candidates = []
        is_scanned_doc = False
        
        # Parcourir chaque page (surtout la première)
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_rect = page.rect
            page_w = page_rect.width
            page_h = page_rect.height
            image_list = page.get_images(full=True)
            
            for img_idx, img in enumerate(image_list):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image:
                        continue
                    image_bytes = base_image["image"]
                    width = base_image["width"]
                    height = base_image["height"]
                except Exception:
                    continue
                
                # Aspect ratio en pixels
                aspect_ratio = width / height if height != 0 else 1.0
                if aspect_ratio < 0.4 or aspect_ratio > 2.5:
                    continue
                
                rects = page.get_image_rects(xref)
                
                if rects:
                    r = rects[0]
                    # Ignorer les arrière-plans ou pages complètes scannées
                    if r.width > page_w * 0.75 or r.height > page_h * 0.75:
                        is_scanned_doc = True
                        continue
                    if r.width > page_w * 0.5 and r.height > page_h * 0.5:
                        is_scanned_doc = True
                        continue
                    # Ignorer les petites icônes
                    if r.width < 25 or r.height < 25:
                        continue
                    # Ignorer les éléments tout en bas (comme les logos de pied de page)
                    if r.y0 > page_h * 0.7:
                        continue
                else:
                    # Fallback sur les dimensions pixel
                    if width < 100 or height < 100:
                        continue
                    if width > 900 or height > 900:
                        continue
                
                # Calculer un score de probabilité
                score = 100.0
                # Plus on s'éloigne d'un carré (1:1), plus on a une pénalité
                score -= 30.0 * abs(1.0 - aspect_ratio)
                
                # Favoriser la première page
                if page_num > 0:
                    score -= 50.0 * page_num
                    
                if rects:
                    r = rects[0]
                    # Favoriser le haut de la page
                    score -= 50.0 * (r.y0 / page_h)
                    # Favoriser une taille de profil idéale (~100 points de large)
                    score -= 0.1 * abs(100.0 - r.width)
                
                candidates.append((score, image_bytes))
                
        # Si la méthode classique a trouvé des candidats et que ce n'est pas un scan
        if candidates and not is_scanned_doc:
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
            
        # =====================================================================
        # FALLBACK : Détection de visage avec OpenCV (si scan ou aucun candidat)
        # =====================================================================
        print("[INFO] Tentative de détection de visage (PDF scanné ou aucune image classique trouvée).")
        try:
            import cv2
            import numpy as np
            
            first_page = doc[0]
            # Zoom pour avoir une résolution correcte (2.0 = ~144 DPI)
            matrix = fitz.Matrix(2.0, 2.0)
            pix = first_page.get_pixmap(matrix=matrix)
            
            # Convertir Pixmap en array NumPy
            img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
            
            # Gérer les canaux de couleur pour OpenCV (qui attend BGR ou BGRA)
            if pix.n == 4:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
            elif pix.n == 1:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
                
            # Convertir en niveaux de gris pour la détection Haar Cascade
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Se concentrer sur le tiers supérieur de la page
            height, width = gray.shape
            upper_third_h = height // 3
            gray_upper_third = gray[:upper_third_h, :]
            
            # Charger le classificateur Haar Cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # Détection
            faces = face_cascade.detectMultiScale(
                gray_upper_third,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            if len(faces) > 0:
                # On prend le premier visage trouvé
                x, y, w, h = faces[0]
                
                # Ajouter une marge autour du visage (ex: 30%)
                margin = int(max(w, h) * 0.3)
                x_start = max(0, x - margin)
                y_start = max(0, y - margin)
                x_end = min(width, x + w + margin)
                y_end = min(upper_third_h, y + h + margin)
                
                # Recadrer l'image couleur originale (toujours RGB ici)
                face_img = img_array[y_start:y_end, x_start:x_end]
                
                # Convertir en BGR pour encoder correctement avec OpenCV
                face_img_bgr = cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR)
                
                # Encoder en octets PNG
                success, buffer = cv2.imencode('.png', face_img_bgr)
                if success:
                    print("[INFO] Visage détecté et extrait avec succès par OpenCV.")
                    return buffer.tobytes()
            else:
                print("[INFO] Aucun visage détecté dans le tiers supérieur de la page.")
                
        except ImportError:
            print("[WARNING] OpenCV ou NumPy introuvables. Installez-les avec 'pip install opencv-python numpy'.")
        except Exception as ex:
            print(f"[WARNING] Erreur lors de la détection de visage : {ex}")

        # Dernier recours : renvoyer la meilleure image trouvée (s'il y en a) même si c'est un scan
        if candidates:
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
            
        return None
    except Exception as e:
        print(f"Erreur d'extraction d'image : {e}")
        return None

# ---------------------------------------------------------
# CONFIGURATION DE L'API LOCALE DIRECTE (OLLAMA NATIVE)
# AUCUN SCHÉMA STRICT (Sortie JSON Libre)
# ---------------------------------------------------------
LOCAL_OLLAMA_URL = "http://localhost:11434/api/chat" 
MODEL_NAME = "mistral"

def extract_cv_data(cv_text: str) -> str:
    print(f"Envoi du CV au modèle {MODEL_NAME} en direct (Format JSON Libre)...")

    # Requête brute pour l'API native de Ollama sans schéma strict
    data = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system", 
                "content": """Tu es un expert RH en extraction de données de CV. Extrais toutes les informations du CV fourni et structure-les dans un objet JSON propre,ton role est l'extraction seulement. Pour que le résultat s'intègre parfaitement dans notre template de présentation, essaie de regrouper les informations (si elles existent) dans ces clés principales :
- nom_complet : Prénom et Nom.
- titre_professionnel : Le titre professionnel ou poste visé (à déduire de l'en-tête du CV, du résumé ou de l'expérience la plus récente).
- disponibilite : Doit TOUJOURS être "immédiate".
- projets_et_experiences : Liste d'objets contenant un "titre" et une "description" concise.
- hard_skills : Langages de programmation, concepts techniques purs (ex: Python, Java, SQL).
- outils_et_technologies : Frameworks, logiciels, bases de données , tous technologie et outils depends de metier(ex: MongoDB, FastAPI, Docker, Elasticsearch).
- soft_skills : Compétences humaines (ex: Communication, travail en équipe).
- langues : Langues parlées et niveaux.
 mandatory:si un champ est absent, il doit être présent mais vide,ne genere rien que le contenu du CV.
Tu peux ajouter d'autres clés si tu trouves des informations pertinentes.
Ne génère QUE du JSON valide."""
            },
            {
                "role": "user", 
                "content": cv_text
            }
        ],
        "format": "json", # Ollama force la sortie à être du JSON valide, mais sans imposer de structure fixe
        "stream": False
    }

    req = urllib.request.Request(
        LOCAL_OLLAMA_URL, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result['message']['content']
            
            # Post-traitement déterministe pour forcer la disponibilité à "immédiate"
            try:
                parsed_json = json.loads(content)
                parsed_json['disponibilite'] = "immédiate"
                return json.dumps(parsed_json, ensure_ascii=False)
            except Exception:
                return content
    except Exception as e:
        raise Exception(f"Erreur de communication avec Ollama: {e}")

if __name__ == "__main__":
    import sys
    import os
    
    # Par défaut, on utilise sample_cv.txt
    file_path = "sample_cv.txt"
    
    # Si un argument est passé en ligne de commande, on l'utilise (ex: python test_extraction.py mon_cv.pdf)
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        
    if not os.path.exists(file_path):
        print(f"Erreur : Le fichier {file_path} n'existe pas.")
        sys.exit(1)
        
    print(f"Lecture du fichier : {file_path}")
    
    # Gérer le cas spécifique du PDF
    if file_path.lower().endswith(".pdf"):
        with open(file_path, "rb") as f:
            cv_content = extract_text_from_pdf(f.read())
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            cv_content = f.read()
    
    try:
        json_result = extract_cv_data(cv_content)
        print("\n=== RÉSULTAT DE L'EXTRACTION JSON (Libre) ===")
        print(json_result)
        
        with open("resultat_cv.json", "w", encoding="utf-8") as out_f:
            out_f.write(json_result)
        print("\n[SUCCESS] Le resultat a ete sauvegarde dans 'resultat_cv.json'")
    except Exception as e:
        print(f"\nErreur : {e}")
