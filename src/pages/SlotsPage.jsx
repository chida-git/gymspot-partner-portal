import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, DatePicker, Space, message } from 'antd'
import dayjs from 'dayjs'
import GymHeader from '../components/GymHeader.jsx'
import SlotsTable from '../components/SlotsTable.jsx'
import { getGymDetail, getSlots, updateSlot } from '../services/api.js'
export default function SlotsPage(){
  const [sp] = useSearchParams()
  const gymId = Number(sp.get('gym_id') || 1)
  const [gym, setGym] = useState(null)
  const [date, setDate] = useState(dayjs())
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => { (async () => {
    try { const d = await getGymDetail(gymId); setGym(d.gym); loadSlots(date) }
    catch (e) { message.error(e.message || 'Errore di rete') }
  })() }, [gymId])
  async function loadSlots(d){
    try { setLoading(true); const rows = await getSlots(gymId, d.format('YYYY-MM-DD')); setSlots(rows) }
    catch (e) { message.error(e.message) } finally { setLoading(false) }
  }
  function onChangeRow(id, patch){ setSlots(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)) }
  async function onSaveRow(id, row){
    try { await updateSlot(id, { capacity: row.capacity, available: row.available, is_active: row.is_active ? 1 : 0 }); message.success('Slot aggiornato') }
    catch (e) { message.error(e.message) } finally { loadSlots(date) }
  }
  return (<div>
    <GymHeader gym={gym} />
    <Card className="content-card" style={{ marginBottom: 16 }}>
      <Space><span>Data:</span><DatePicker value={date} onChange={(d)=>{setDate(d); loadSlots(d)}} /></Space>
    </Card>
    <Card className="content-card"><SlotsTable slots={slots} loading={loading} onChangeRow={onChangeRow} onSaveRow={onSaveRow} /></Card>
  </div>)
}