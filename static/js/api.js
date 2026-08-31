// API Interaction functions
export async function extractBatch(file) {
  const formData = new FormData();
  formData.append('files', file);

  const res = await fetch('/api/extract-batch', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error("Erreur d'upload");
  return res.json();
}

export async function getBatchStatus(jobId) {
  const res = await fetch(`/api/batch-status/${jobId}`);
  if (!res.ok) throw new Error("Erreur de statut");
  return res.json();
}

export async function getProfile(id) {
  const res = await fetch(`/api/profiles/${id}`);
  if (!res.ok) throw new Error("Profil non trouvé");
  return res.json();
}

export async function updateProfile(id, profile) {
  const res = await fetch(`/api/profiles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error("Erreur de sauvegarde");
  return res.json();
}

export async function generatePpt(profile) {
  const res = await fetch('/api/generate-ppt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error("Erreur PPT");
  return res.blob();
}
