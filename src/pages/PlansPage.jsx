import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, message, Button } from 'antd'
import GymHeader from '../components/GymHeader.jsx'
import PlansTable from '../components/PlansTable.jsx'
import PlanCreateModal from '../components/PlanCreateModal.jsx'
import { getGymDetail, getPlans, updatePlan, createPlan, deletePlan } from '../services/api.js'
export default function PlansPage(){
  const [sp] = useSearchParams()
  const gymId = Number(sp.get('gym_id') || 1)
  const [plans, setPlans] = useState([])
  const [creating, setCreating] = useState(false)
  useEffect(() => { (async () => {
    try {
      const p = await getPlans(gymId); setPlans(p)
    } catch (e) { message.error(e.message || 'Errore di rete') }
  })() }, [gymId])
  async function onUpdate(id, payload){
    try { await updatePlan(id, payload); const p = await getPlans(gymId); setPlans(p); message.success('Piano aggiornato') }
    catch (e) { message.error(e.message || 'Errore aggiornamento') }
  }
  return (<div><GymHeader gymId={gymId} /><Card className="content-card" extra={<Button type='primary' onClick={()=>setCreating(true)}>Nuovo piano</Button>}>
          <PlansTable plans={plans} onUpdate={onUpdate} onDelete={onDelete}/>
        </Card>
        <PlanCreateModal open={creating} onCancel={()=>setCreating(false)} onSubmit={onCreate}/></div>)
}
async function onCreate(payload){
  try {
    await createPlan(gymId, payload)
    const p = await getPlans(gymId); setPlans(p)
    message.success('Piano creato')
  } catch (e) { message.error(e.message || 'Errore creazione') }
  finally { setCreating(false) }
}

async function onDelete(rec){
  try {
    await deletePlan(rec.id)
    const p = await getPlans(gymId); setPlans(p)
    message.success('Piano eliminato')
  } catch (e) { message.error(e.message || 'Errore eliminazione') }
}
