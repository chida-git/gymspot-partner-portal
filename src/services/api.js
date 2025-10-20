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

export async function fetchRoutesConfig(gymId, signal) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/routes/${gymId}/routes`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // es: { overview: true, plans: false, ... }
}

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

// --- EXTRAS ---
// Lista di tutti gli extra disponibili
export async function listExtras() {
  const { data } = await api.get('/extras');
  return data; // { data: [ {id,name,description,...}, ... ] }
}

// Crea un extra
export async function createExtra(payload) {
  // payload: { name: string, description?: string }
  const { data } = await api.post('/extras', payload);
  return data; // { data: {...} }
}

// Aggiorna un extra
export async function updateExtra(extraId, payload) {
  // payload: { name?: string, description?: string }
  const { data } = await api.put(`/extras/${extraId}`, payload);
  return data; // { data: {...} }
}

// Elimina un extra
export async function deleteExtra(extraId) {
  const { data } = await api.delete(`/extras/${extraId}`);
  return data; // { data: { deleted: id } }
}

// --- GYM ↔ EXTRAS ---
// Lista degli extra associati a una palestra
export async function getGymExtras(gymId) {
  const { data } = await api.get(`/extras_gym/${gymId}/extras`);
  return data; // { data: [ {id,name,description}, ... ] }
}

// Aggiunge (merge/idempotente) uno o più extra alla palestra
export async function addGymExtras(gymId, extraIds) {
  // extraIds: number[]
  const { data } = await api.post(`/extras_gym/${gymId}/extras`, { extraIds });
  return data; // { data: [ ...lista aggiornata... ] }
}

// Sostituisce completamente la lista degli extra per la palestra
export async function setGymExtras(gymId, extraIds) {
  // extraIds: number[] (può essere vuoto [])
  const { data } = await api.put(`/extras_gym/${gymId}/extras`, { extraIds });
  return data; // { data: [ ...lista aggiornata... ] }
}

// Rimuove un singolo extra dalla palestra
export async function removeGymExtra(gymId, extraId) {
  const { data } = await api.delete(`/extras_gym/${gymId}/extras/${extraId}`);
  return data; // { data: { gymId, extraId } }
}


export const getCourseTypes = (gymId) =>
  api.get(`/course/${gymId}/course-types`);

export const getWeeklySlots = (gymId) =>
  api.get(`/weekly_slots/${gymId}/weekly-slots`);

export const getSchedule = (gymId, { from, to, courseTypeId }) =>
  api.get(`/schedule/${gymId}/schedule`, { params: { from, to, courseTypeId } });

// --- Corsi: CREATE ---
export const createCourseType = (gymId, payload) =>
  api.post(`/course/${gymId}/course-types`, payload);

export const createWeeklySlot = (gymId, payload) =>
  api.post(`/weekly_slots/${gymId}/weekly-slots`, payload);

// UPDATE: tipo corso (soft-delete possibile)
export const updateCourseType = (id, payload) =>
  api.patch(`/course/course-types/${id}`, payload);

// UPDATE: weekly slot
export const updateWeeklySlot = (id, payload) =>
  api.patch(`/weekly_slots/weekly-slots/${id}`, payload);

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
