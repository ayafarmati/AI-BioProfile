import json
import os
import copy
from pptx import Presentation
from pptx.util import Pt
from pptx.enum.text import MSO_AUTO_SIZE

def generate_bio_profile_dynamic(json_path="resultat_cv.json", template_path="BioPofile_Template.pptx", output_path="BioProfile_Generated.pptx"):
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Le fichier JSON {json_path} est introuvable.")
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    def flatten_data(data_obj, sep=", ", is_lang=False):
        if isinstance(data_obj, str):
            return data_obj
        elif isinstance(data_obj, list):
            flattened = []
            for item in data_obj:
                if isinstance(item, str):
                    flattened.append(item)
                elif isinstance(item, dict):
                    if 'langue' in item:
                        niv = item.get('niveau', '')
                        flattened.append(f"{item['langue']} - {niv}" if niv else item['langue'])
                    else:
                        flattened.extend(flatten_data(item, sep, is_lang).split(sep))
            return sep.join(flattened)
        elif isinstance(data_obj, dict):
            flattened = []
            for k, v in data_obj.items():
                if isinstance(v, str) and is_lang:
                    flattened.append(f"{k} - {v}")
                elif isinstance(v, str):
                    flattened.append(v)
                elif isinstance(v, list):
                    flattened.extend(flatten_data(v, sep, is_lang).split(sep))
                elif isinstance(v, dict):
                    flattened.extend(flatten_data(v, sep, is_lang).split(sep))
            return sep.join(flattened)
        return str(data_obj)
        
    prs = Presentation(template_path)
    slide = prs.slides[0]

    # Préparation des données formatées
    nom = data.get("nom_complet", "")
    titre = data.get("titre_professionnel", "")
    dispo = data.get("disponibilite", "Immédiate")
    
    langues = flatten_data(data.get("langues", []), sep="\n", is_lang=True)
    hard = flatten_data(data.get("hard_skills", []))
    soft = flatten_data(data.get("soft_skills", []))
    outils = flatten_data(data.get("outils_et_technologies", []))
    
    projets = data.get("projets_et_experiences", [])
    if isinstance(projets, dict):
        for v in projets.values():
            if isinstance(v, list):
                projets = v
    hard = flatten_data(data.get("hard_skills", []))
    soft = flatten_data(data.get("soft_skills", []))
    outils = flatten_data(data.get("outils_et_technologies", []))

    # Dictionnaire de remplacement simple
    replacements = {
        "{{NOM}}": nom,
        "{{TITRE}}": titre,
        "{{DISPO}}": dispo,
        "{{LANGUES}}": langues,
        "{{HARD}}": hard,
        "{{SOFT}}": soft,
        "{{OUTILS}}": outils
    }

    # Liste pour mémoriser les formes à supprimer (comme {{PHOTO}})
    shapes_to_delete = []

    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
            
        text = shape.text
        
        # 1. Gestion de l'Image de profil
        if "{{PHOTO}}" in text:
            # Récupérer les coordonnées et dimensions
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            
            photo_path = data.get("photo_path")
            if photo_path and photo_path.startswith("/"):
                photo_path = photo_path[1:]
                
            if photo_path and os.path.exists(photo_path):
                try:
                    slide.shapes.add_picture(photo_path, left, top, width=width, height=height)
                except Exception as e:
                    print(f"Erreur insertion image: {e}")
                    
            # Marquer la boîte de texte {{PHOTO}} pour suppression
            shapes_to_delete.append(shape)
            continue

        # 2. Gestion des Projets (Formatage complexe avec Titre et Description)
        if "{{PROJETS}}" in text:
            # Sauvegarder le style initial de la balise
            font_size = None
            font_bold = None
            font_color = None
            font_name = None
            if shape.text_frame.paragraphs and shape.text_frame.paragraphs[0].runs:
                r = shape.text_frame.paragraphs[0].runs[0]
                font_size = r.font.size
                font_bold = r.font.bold
                if hasattr(r.font.color, 'rgb'):
                    font_color = r.font.color.rgb
                font_name = r.font.name

            shape.text_frame.clear()
            shape.text_frame.word_wrap = True
            shape.text_frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
            
            if isinstance(projets, list):
                # Auto-ajustement ultra-agressif pour les projets
                base_title_size = font_size.pt if font_size else 22
                
                if len(projets) >= 5:
                    base_title_size = 11
                    desc_size = 9
                elif len(projets) == 4:
                    base_title_size = 14
                    desc_size = 11
                elif len(projets) == 3:
                    base_title_size = 16
                    desc_size = 12
                else:
                    desc_size = max(12, base_title_size - 4)
                
                for i, p_data in enumerate(projets):
                    titre_proj = p_data.get("titre", "") if isinstance(p_data, dict) else ""
                    desc_proj = p_data.get("description", "") if isinstance(p_data, dict) else str(p_data)
                    
                    # Ajouter le titre
                    p = shape.text_frame.add_paragraph()
                    p.text = titre_proj
                    if font_name: p.font.name = font_name
                    p.font.size = Pt(base_title_size)
                    p.font.bold = True
                    if font_color: p.font.color.rgb = font_color
                    
                    # Ajouter la description
                    p = shape.text_frame.add_paragraph()
                    p.text = desc_proj
                    if font_name: p.font.name = font_name
                    p.font.size = Pt(desc_size)
                    p.font.bold = False
                    if font_color: p.font.color.rgb = font_color
                    
                    # Espace seulement s'il n'y a pas trop de projets
                    if len(projets) <= 3 and i < len(projets) - 1:
                        p_space = shape.text_frame.add_paragraph()
                        p_space.font.size = Pt(max(6, base_title_size - 8))
            continue

        # 3. Gestion des remplacements classiques
        for p in shape.text_frame.paragraphs:
            for r in p.runs:
                for tag, value in replacements.items():
                    if tag in r.text:
                        str_val = str(value)
                        r.text = r.text.replace(tag, str_val)
                        shape.text_frame.word_wrap = True
                        
                        # Auto-ajustement manuel basé sur la longueur du texte
                        if len(str_val) > 70 and r.font.size:
                            # Plus le texte est long, plus on réduit (jusqu'à 7pt)
                            reduction = int((len(str_val) - 70) / 30)
                            new_size = max(7, r.font.size.pt - reduction)
                            r.font.size = Pt(new_size)

    # Supprimer les formes obsolètes (ex: boîte {{PHOTO}})
    for shape in shapes_to_delete:
        sp = shape.element
        sp.getparent().remove(sp)

    prs.save(output_path)
    print(f"Presentation dynamique generee: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_bio_profile_dynamic()
