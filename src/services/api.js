import { message } from 'antd'
import axios from 'axios'
const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
export const api = axios.create({ baseURL, timeout: 15000 })
export async function getGymDetail(gymId){ const { data } = await api.get(`/gyms/${gymId}`); return data }
export async function getPlans(gymId){ const { data } = await api.get('/plans', { params: { gym_id: gymId } }); return data }
export async function updatePlan(planId, payload){ const { data } = await api.patch(`/partner/plans/${planId}`, payload); return data }
export async function getSlots(gymId, date){ const { data } = await api.get('/partner/slots', { params: { gym_id: gymId, date } }); return data }
export async function updateSlot(slotId, payload){ const { data } = await api.patch(`/partner/slots/${slotId}`, payload); return data }
// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout se riceviamo 401 dal backend
function goLogin() {
  const gymId = JSON.parse(localStorage.getItem('pp_partner') || '{}')?.gym_id || 1
  window.location.href = `/login?gym_id=${gymId}`
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('pp_token')
      localStorage.removeItem('pp_partner')
      message.warning('Sessione scaduta. Effettua di nuovo il login.')
      goLogin()
    }
    return Promise.reject(error)
  }
)

export async function partnerLogin(email, password){
  const { data } = await api.post('/auth/partner/login', { email, password })
  // expected { token, partner }
  return data
}

export async function createPlan(gymId, payload){
  const { data } = await api.post('/partner/plans', { gym_id: gymId, ...payload })
  return data
}

export async function deletePlan(planId){
  const { data } = await api.delete(`/partner/plans/${planId}`)
  return data
}

export async function getCheckins(gymId, date, q){
  const { data } = await api.get('/partner/checkins', { params: { gym_id: gymId, date, q } })
  return data
}

export async function validateAccessAndFetchUser(tokenRaw) {
  const { data } = await api.post('/partner/access/validate-user', { token_raw: tokenRaw })
  return data // { granted, id_user, device_id, user }
}

export async function getUserFull(idUser) {
  const { data } = await api.get(`/partner/access/users/${idUser}/full`)
  return data  // { id_user, user: {name,surname,mail}, subscription: {...} }
}

// --- PROFILE ---
export async function getGymProfile(gymId) {
  const rs = await fetch(`${import.meta.env.VITE_API_BASE}/gyms/${gymId}/profile`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });

  if (!rs.ok) throw new Error(`getGymProfile ${rs.status}`);
  return rs.json();
}

export async function updateGymProfile(gymId, data) {
  const rs = await fetch(`${import.meta.env.VITE_API_BASE}/gyms/${gymId}/profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!rs.ok) {
    const errText = await rs.text().catch(()=>'');
    throw new Error(`updateGymProfile ${rs.status} ${errText}`);
  }
  return rs.json();
}

// --- PRESENTATION IMAGES ---
export async function listPresentationImages(gymId, { limit = 10, token = '' } = {}) {
  const url = new URL(`${import.meta.env.VITE_API_BASE}/gyms/${gymId}/presentation/images`);
  url.searchParams.set('limit', String(limit));
  if (token) url.searchParams.set('token', token);
  const rs = await fetch(url, { credentials: 'include' });
  if (!rs.ok) throw new Error(`listImages ${rs.status}`);
  return rs.json(); // { ok, items:[{key,filename,url}], nextToken }
}

export async function uploadPresentationImages(gymId, files) {
  const fd = new FormData();
  [...files].forEach(f => fd.append('images', f));
  const rs = await fetch(`${import.meta.env.VITE_API_BASE}/gyms/${gymId}/presentation/images`, {
    method: 'POST',
    credentials: 'include',
    body: fd
  });
  if (!rs.ok) {
    const t = await rs.text().catch(()=> '');
    throw new Error(t || `uploadImages ${rs.status}`);
  }
  return rs.json();
}

export async function deletePresentationImage(gymId, filename) {
  const rs = await fetch(`${import.meta.env.VITE_API_BASE}/gyms/${gymId}/presentation/images/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!rs.ok) throw new Error(`deleteImage ${rs.status}`);
  return rs.json();
}

// --- INDEX PHOTO ---
export function getIndexImageUrl(gymId) {
  // endpoint restituisce l’immagine: usiamo URL diretto con cache-buster
  const ts = Date.now();
  return `${import.meta.env.VITE_API_BASE}/gyms/${gymId}/presentation/index?ts=${ts}`;
}

export async function putIndexImage(gymId, file) {
  const fd = new FormData();
  fd.append('image', file);
  const rs = await fetch(`${import.meta.env.VITE_API_BASE}/gyms/${gymId}/presentation/index`, {
    method: 'PUT',
    credentials: 'include',
    body: fd
  });
  if (!rs.ok) {
    const t = await rs.text().catch(()=> '');
    throw new Error(t || `putIndexImage ${rs.status}`);
  }
  return rs.json();
}
