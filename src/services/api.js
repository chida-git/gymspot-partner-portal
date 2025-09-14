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

export async function validateAccessAndFetchUser(tokenRaw, deviceId) {
  const { data } = await api.post('/partner/access/validate-user', {
    token_raw: tokenRaw,
    device_id: deviceId,
  })
  return data  // { granted, id_user, user }
}
