from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import json
import time

# Importer notre fonction d'extraction locale (Ollama text-only) et le traitement de fichier
from extraction_ollama_markdown import extract_cv_data_llm_from_text as extract_cv_data
from extraction_ollama_markdown import extract_text_from_pdf_as_markdown as extract_text_from_pdf
from extraction_ollama_markdown import extract_image_from_pdf, extract_text_from_docx, extract_image_from_docx

app = FastAPI(title="AI Bio Profile Generator API")

# Configure CORS for React Dev Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schéma pour la requête API
class ExtractRequest(BaseModel):
    cv_text: str

import os
import glob
os.makedirs("frontend/dist/assets", exist_ok=True)
os.makedirs("profiles", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("templates", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/templates", StaticFiles(directory="templates"), name="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/api/latest-profile")
async def get_latest_profile():
    try:
        if os.path.exists("resultat_cv.json"):
            with open("resultat_cv.json", "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        else:
            raise HTTPException(status_code=404, detail="Aucun profil récent trouvé.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract")
async def extract_profile(request: ExtractRequest):
    try:
        # Appeler notre modèle local via Ollama
        json_string = await run_in_threadpool(extract_cv_data, request.cv_text)
        json_data = json.loads(json_string)
        
        # S'assurer que photo_path est présent
        if "photo_path" not in json_data:
            json_data["photo_path"] = ""
            
        # Sauvegarder dans un fichier JSON avant de l'envoyer à l'interface
        with open("resultat_cv.json", "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        nom = json_data.get("nom_complet")
        if not nom:
            nom = "Inconnu"
        nom = str(nom).strip().replace(" ", "_")
        filepath = f"profiles/{nom}_{int(time.time())}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        return json_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import zipfile

@app.get("/api/templates")
async def get_templates():
    try:
        templates = []
        for file in os.listdir("templates"):
            if file.endswith(".pptx"):
                name = file
                thumb = file.replace(".pptx", ".jpeg")
                thumb_full = f"templates/{thumb}"
                
                # S'il n'existe pas ou s'il est trop petit (souvent une image vide intégrée par PowerPoint)
                if not os.path.exists(thumb_full) or os.path.getsize(thumb_full) < 5000:
                    import subprocess
                    import sys
                    try:
                        subprocess.run([sys.executable, "thumbnail_generator.py", f"templates/{name}", thumb_full], capture_output=True, timeout=15)
                    except Exception as e:
                        print(f"Erreur generation thumbnail {name}: {e}")
                        
                if not os.path.exists(thumb_full):
                    thumb = None
                    
                templates.append({
                    "filename": name,
                    "thumbnail": f"/templates/{thumb}" if thumb else None
                })
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-template")
async def upload_template(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .pptx sont acceptés.")
        
    try:
        content = await file.read()
        filename = file.filename.replace(" ", "_")
        filepath = f"templates/{filename}"
        
        with open(filepath, "wb") as f:
            f.write(content)
            
        # Extraire la miniature
        thumb_path = filepath.replace(".pptx", ".jpeg")
        extracted = False
        
        # 1. Toujours essayer de générer une vraie miniature via COM d'abord
        import subprocess
        import sys
        try:
            res = subprocess.run([sys.executable, "thumbnail_generator.py", filepath, thumb_path], capture_output=True, timeout=15)
            if res.returncode == 0 and os.path.exists(thumb_path):
                # Vérifier que ce n'est pas une image vide (PowerPoint génère parfois des fichiers minuscules)
                if os.path.getsize(thumb_path) > 5000:
                    extracted = True
        except Exception as e:
            print(f"Erreur generation thumbnail upload COM: {e}")
            
        # 2. Si ça échoue, essayer d'extraire la miniature intégrée
        if not extracted:
            try:
                with zipfile.ZipFile(filepath, "r") as z:
                    if "docProps/thumbnail.jpeg" in z.namelist():
                        with open(thumb_path, "wb") as img_f:
                            img_f.write(z.read("docProps/thumbnail.jpeg"))
                        extracted = True
            except:
                pass
            
        return {
            "filename": filename,
            "thumbnail": f"/templates/{os.path.basename(thumb_path)}" if extracted else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/templates/{filename}")
async def delete_template(filename: str):
    if filename == "BioProfile_OFF.pptx":
        raise HTTPException(status_code=400, detail="Impossible de supprimer le modèle par défaut du système.")
    try:
        filepath = f"templates/{filename}"
        if os.path.exists(filepath):
            os.remove(filepath)
        thumb_path = filepath.replace(".pptx", ".jpeg")
        if os.path.exists(thumb_path):
            os.remove(thumb_path)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-file")
async def extract_profile_from_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        filename = file.filename.lower()
        photo_path = ""
        pdf_path = ""
        
        # Save the file to uploads
        safe_filename = str(int(time.time())) + "_" + file.filename.replace(" ", "_")
        pdf_path = f"uploads/{safe_filename}"
        with open(pdf_path, "wb") as f:
            f.write(content)
        
        page_images_base64 = None
        if filename.endswith(".pdf"):
            cv_text = await run_in_threadpool(extract_text_from_pdf, content)
            image_bytes = await run_in_threadpool(extract_image_from_pdf, content)
            if image_bytes:
                temp_img_path = "static/temp_photo.png"
                if os.path.exists(temp_img_path):
                    try:
                        os.remove(temp_img_path)
                    except Exception:
                        pass
                with open(temp_img_path, "wb") as img_f:
                    img_f.write(image_bytes)
                photo_path = f"/static/temp_photo.png?v={int(time.time())}"
        elif filename.endswith(".docx"):
            cv_text = await run_in_threadpool(extract_text_from_docx, content)
            image_bytes = await run_in_threadpool(extract_image_from_docx, content)
            if image_bytes:
                temp_img_path = "static/temp_photo.png"
                if os.path.exists(temp_img_path):
                    try:
                        os.remove(temp_img_path)
                    except Exception:
                        pass
                with open(temp_img_path, "wb") as img_f:
                    img_f.write(image_bytes)
                photo_path = f"/static/temp_photo.png?v={int(time.time())}"
        elif filename.endswith(".txt"):
            cv_text = content.decode("utf-8", errors="replace")
        else:
            raise HTTPException(status_code=400, detail="Format non supporté (PDF, DOCX et TXT uniquement).")
            
        if not cv_text.strip() and not page_images_base64:
            raise HTTPException(status_code=400, detail="Le fichier est vide ou le texte n'a pas pu être lu.")
            
        # SAUVEGARDE DU TEXTE EXTRAIT AVANT ENVOI AU LLM
        debug_text_path = f"uploads/{safe_filename}_extracted.md"
        with open(debug_text_path, "w", encoding="utf-8") as f:
            f.write(cv_text)
        print(f"[DEBUG] Texte extrait (Markdown/Brut) sauvegardé dans : {debug_text_path}")
            
        json_string = await run_in_threadpool(extract_cv_data, cv_text)
        json_data = json.loads(json_string)
        
        # Ajouter le chemin de la photo de profil et du PDF original
        json_data["photo_path"] = photo_path
        json_data["pdf_path"] = f"/{pdf_path}"
        
        # Sauvegarder dans un fichier JSON avant de l'envoyer à l'interface
        with open("resultat_cv.json", "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        nom = json_data.get("nom_complet")
        if not nom:
            nom = "Inconnu"
        nom = str(nom).strip().replace(" ", "_")
        filepath = f"profiles/{nom}_{int(time.time())}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        original_filepath = filepath.replace(".json", "_original.json")
        with open(original_filepath, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        return json_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# --- SYSTEME BATCH ---
from fastapi import BackgroundTasks
import uuid

batch_jobs = {}

from concurrent.futures import ThreadPoolExecutor, as_completed

def process_single_file(job_id, file_info):
    if batch_jobs.get(job_id, {}).get("cancelled"):
        return
        
    filename = file_info["filename"]
    content = file_info["content"]
    pdf_path = file_info.get("pdf_path", "")
    
    batch_jobs[job_id]["files"][filename]["status"] = "processing"
    batch_jobs[job_id]["files"][filename]["message"] = "Extraction du texte..."
    
    # Convert DOCX to PDF for preview if needed
    if filename.endswith(".docx") and pdf_path.endswith(".docx"):
        try:
            from docx2pdf import convert
            import os
            local_path = pdf_path.lstrip("/")
            pdf_out = local_path + ".pdf"
            abs_in = os.path.abspath(local_path)
            abs_out = os.path.abspath(pdf_out)
            print(f"[INFO] Conversion du DOCX en PDF pour l'apercu: {abs_in}")
            convert(abs_in, abs_out)
            if os.path.exists(abs_out):
                pdf_path = f"/{pdf_out}"
        except Exception as e:
            print(f"[WARNING] Conversion DOCX vers PDF echouee: {e}")
    
    try:
        photo_path = ""
        page_images_base64 = None
        if filename.endswith(".pdf"):
            cv_text = extract_text_from_pdf(content)
            image_bytes = extract_image_from_pdf(content)
            if image_bytes:
                temp_img_path = f"static/temp_{uuid.uuid4().hex[:8]}.png"
                with open(temp_img_path, "wb") as img_f:
                    img_f.write(image_bytes)
                photo_path = f"/{temp_img_path}?v={int(time.time())}"
        elif filename.endswith(".docx"):
            cv_text = extract_text_from_docx(content)
            image_bytes = extract_image_from_docx(content)
            if image_bytes:
                temp_img_path = f"static/temp_{uuid.uuid4().hex[:8]}.png"
                with open(temp_img_path, "wb") as img_f:
                    img_f.write(image_bytes)
                photo_path = f"/{temp_img_path}?v={int(time.time())}"
        elif filename.endswith(".txt"):
            cv_text = content.decode("utf-8", errors="replace")
        else:
            batch_jobs[job_id]["files"][filename]["status"] = "error"
            batch_jobs[job_id]["files"][filename]["message"] = "Format non supporté."
            return
            
        if not cv_text.strip() and not page_images_base64:
            batch_jobs[job_id]["files"][filename]["status"] = "error"
            batch_jobs[job_id]["files"][filename]["message"] = "Texte vide."
            return
        
        # SAUVEGARDE DU TEXTE EXTRAIT AVANT ENVOI AU LLM
        safe_base = filename.replace(" ", "_")
        debug_text_path = f"uploads/{int(time.time())}_{safe_base}_extracted.md"
        with open(debug_text_path, "w", encoding="utf-8") as f:
            f.write(cv_text)
        print(f"[DEBUG BATCH] Texte extrait sauvegardé dans : {debug_text_path}")
        
        if batch_jobs.get(job_id, {}).get("cancelled"):
            return
            
        batch_jobs[job_id]["files"][filename]["message"] = "Analyse IA..."
        
        json_string = extract_cv_data(cv_text)
        json_data = json.loads(json_string)
        json_data["photo_path"] = photo_path
        json_data["pdf_path"] = pdf_path
        
        nom = json_data.get("nom_complet")
        if not nom: nom = "Inconnu"
        nom = str(nom).strip().replace(" ", "_")
        filepath = f"profiles/{nom}_{int(time.time())}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        original_filepath = filepath.replace(".json", "_original.json")
        with open(original_filepath, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False)
            
        batch_jobs[job_id]["files"][filename]["status"] = "done"
        batch_jobs[job_id]["files"][filename]["message"] = "Terminé"
        batch_jobs[job_id]["files"][filename]["result"] = filepath
        
    except Exception as e:
        batch_jobs[job_id]["files"][filename]["status"] = "error"
        batch_jobs[job_id]["files"][filename]["message"] = f"Erreur: {str(e)}"

def process_batch_task(job_id: str, files_data: list):
    # Max workers = 1 to limit Ollama/CPU saturation
    with ThreadPoolExecutor(max_workers=1) as executor:
        futures = [executor.submit(process_single_file, job_id, f) for f in files_data]
        for _ in as_completed(futures):
            pass
            
    batch_jobs[job_id]["status"] = "done"

from typing import List

@app.post("/api/extract-batch")
async def extract_batch_profiles(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    job_id = str(uuid.uuid4())
    batch_jobs[job_id] = {"status": "processing", "files": {}}
    
    files_data = []
    for f in files:
        filename = f.filename.lower()
        batch_jobs[job_id]["files"][filename] = {"status": "pending", "message": "En attente"}
        content = await f.read()
        
        # Save the file to uploads
        safe_filename = str(int(time.time())) + "_" + uuid.uuid4().hex[:8] + "_" + f.filename.replace(" ", "_")
        pdf_path = f"uploads/{safe_filename}"
        with open(pdf_path, "wb") as out_f:
            out_f.write(content)
            
        files_data.append({"filename": filename, "content": content, "pdf_path": f"/{pdf_path}"})
        
    background_tasks.add_task(process_batch_task, job_id, files_data)
    return {"job_id": job_id, "message": "Batch démarré"}

@app.get("/api/batch-status/{job_id}")
async def get_batch_status(job_id: str):
    if job_id not in batch_jobs:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    return batch_jobs[job_id]

@app.post("/api/batch-cancel/{job_id}")
async def cancel_batch(job_id: str):
    if job_id in batch_jobs:
        batch_jobs[job_id]["cancelled"] = True
        batch_jobs[job_id]["status"] = "error"
        for filename, f_info in batch_jobs[job_id]["files"].items():
            if f_info["status"] in ["pending", "processing"]:
                f_info["status"] = "error"
                f_info["message"] = "Annulé par l'utilisateur"
    return {"status": "ok"}

@app.get("/api/active-batches")
async def get_active_batches():
    # Return all batches that are currently processing
    active = {}
    for jid, job in batch_jobs.items():
        if job.get("status") == "processing":
            active[jid] = job
    return active

from typing import Dict, Any

@app.post("/api/generate-ppt")
async def generate_ppt(data: Dict[str, Any]):
    try:
        # Sauvegarder les donnees mises a jour
        with open("resultat_cv.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
            
        nom = data.get("nom_complet")
        if not nom:
            nom = "Inconnu"
        nom = str(nom).strip().replace(" ", "_")
        
        filepath = f"profiles/{nom}_{int(time.time())}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
            
        from generate_pptx_v3 import generate_bio_profile_dynamic
        
        template_name = data.get("template", "BioProfile_OFF.pptx")
        template_path = f"templates/{template_name}"
        if not os.path.exists(template_path):
            template_path = template_name
        if not os.path.exists(template_path):
            template_path = "BioProfile_OFF.pptx"
            
        output_file = await run_in_threadpool(generate_bio_profile_dynamic, template_path=template_path)
        return FileResponse(output_file, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename="BioProfile_Generated.pptx")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profiles")
async def get_profiles_list():
    try:
        profiles = []
        files = glob.glob("profiles/*.json")
        for fpath in files:
            if fpath.endswith("_original.json"):
                continue
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    profiles.append({
                        "filename": os.path.basename(fpath),
                        "nom_complet": data.get("nom_complet", "Inconnu"),
                        "titre_professionnel": data.get("titre_professionnel", "") or data.get("professional_title", ""),
                        "photo_path": data.get("photo_path", ""),
                        "technical_skills": data.get("technical_skills", []),
                        "tools": data.get("tools", []),
                        "timestamp": os.path.getctime(fpath)
                    })
            except Exception:
                pass
        # Trier par timestamp décroissant (les plus récents en premier)
        profiles.sort(key=lambda x: x["timestamp"], reverse=True)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profiles/{filename}")
async def get_specific_profile(filename: str):
    try:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
        filepath = os.path.join("profiles", filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Profil non trouvé.")
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        with open("resultat_cv.json", "w", encoding="utf-8") as current:
            json.dump(data, current, ensure_ascii=False)
            
        return data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/profiles/{filename}/reset")
async def reset_profile(filename: str):
    try:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
        
        current_path = os.path.join("profiles", filename)
        original_filename = filename.replace(".json", "_original.json")
        original_path = os.path.join("profiles", original_filename)
        
        if not os.path.exists(original_path):
            raise HTTPException(status_code=404, detail="Fichier d'origine introuvable.")
            
        with open(original_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        with open(current_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
            
        with open("resultat_cv.json", "w", encoding="utf-8") as current:
            json.dump(data, current, ensure_ascii=False)
            
        return data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/profiles/{filename}")
async def delete_profile(filename: str):
    try:
        # Prevent path traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
            
        filepath = os.path.join("profiles", filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Profil non trouvé.")
            
        os.remove(filepath)
        return {"status": "success", "message": "Profil supprimé."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/profiles/{filename}")
async def update_profile(filename: str, data: Dict[str, Any]):
    try:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
            
        filepath = os.path.join("profiles", filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Profil non trouvé.")
            
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
            
        # Update current result
        with open("resultat_cv.json", "w", encoding="utf-8") as current:
            json.dump(data, current, ensure_ascii=False)
            
        return {"status": "success", "message": "Profil mis à jour."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-photo/{filename}")
async def upload_photo(filename: str, file: UploadFile = File(...)):
    try:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
            
        filepath = os.path.join("profiles", filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Profil non trouvé.")
            
        content = await file.read()
        safe_photo_name = f"photo_{int(time.time())}_{file.filename.replace(' ', '_')}"
        photo_path = f"static/{safe_photo_name}"
        
        with open(photo_path, "wb") as f:
            f.write(content)
            
        # Update the profile JSON
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        data["photo_path"] = f"/{photo_path}?v={int(time.time())}"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
            
        with open("resultat_cv.json", "w", encoding="utf-8") as current:
            json.dump(data, current, ensure_ascii=False)
            
        return {"status": "success", "photo_path": data["photo_path"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fallback route for React Router SPA
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    return {"message": "React App Not Built Yet. Run 'npm run build' in frontend directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8080, reload=True)
