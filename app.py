from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import json

# Importer notre fonction d'extraction existante et le traitement de fichier PDF
from test_extraction import extract_cv_data, extract_text_from_pdf, extract_image_from_pdf

app = FastAPI(title="AI Bio Profile Generator API")

# Schéma pour la requête API
class ExtractRequest(BaseModel):
    cv_text: str

# Monter le dossier static pour servir le HTML/CSS/JS
import os
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

@app.post("/api/extract")
async def extract_profile(request: ExtractRequest):
    try:
        # Appeler notre modèle local via OpenAI API
        json_string = extract_cv_data(request.cv_text)
        json_data = json.loads(json_string)
        
        # S'assurer que photo_path est présent
        if "photo_path" not in json_data:
            json_data["photo_path"] = ""
            
        # Sauvegarder dans un fichier JSON avant de l'envoyer à l'interface
        with open("resultat_cv.json", "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        return json_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-file")
async def extract_profile_from_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        filename = file.filename.lower()
        photo_path = ""
        
        if filename.endswith(".pdf"):
            cv_text = extract_text_from_pdf(content)
            # Extraire la photo de profil si elle existe
            image_bytes = extract_image_from_pdf(content)
            if image_bytes:
                temp_img_path = "static/temp_photo.png"
                if os.path.exists(temp_img_path):
                    try:
                        os.remove(temp_img_path)
                    except Exception:
                        pass
                with open(temp_img_path, "wb") as img_f:
                    img_f.write(image_bytes)
                photo_path = "/static/temp_photo.png"
        elif filename.endswith(".txt"):
            cv_text = content.decode("utf-8", errors="replace")
        else:
            raise HTTPException(status_code=400, detail="Format non supporté (PDF et TXT uniquement).")
            
        if not cv_text.strip():
            raise HTTPException(status_code=400, detail="Le fichier est vide ou le texte n'a pas pu être lu.")
            
        json_string = extract_cv_data(cv_text)
        json_data = json.loads(json_string)
        
        # Ajouter le chemin de la photo de profil
        json_data["photo_path"] = photo_path
        
        # Sauvegarder dans un fichier JSON avant de l'envoyer à l'interface
        with open("resultat_cv.json", "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        return json_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
