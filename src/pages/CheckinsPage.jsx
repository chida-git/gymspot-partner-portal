import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, DatePicker, Input, Table, Space, Tag, message } from 'antd'
import dayjs from 'dayjs'
import GymHeader from '../components/GymHeader.jsx'
import { getGymDetail, getCheckins } from '../services/api.js'

export default function CheckinsPage(){
  const [sp] = useSearchParams()
  const gymId = Number(sp.get('gym_id') || 1)
  const [gym, setGym] = useState(null)
  const [date, setDate] = useState(dayjs())
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { (async () => {
    try { const d = await getGymDetail(gymId); setGym(d.gym); await load() } catch (e) { message.error(e.message) }
  })() }, [gymId])

  async function load(d = date, text = q){
    try {
      setLoading(true)
      const data = await getCheckins(gymId, d.format('YYYY-MM-DD'), text || undefined)
      setRows(data)
    } catch (e) { message.error(e.message) } finally { setLoading(false) }
  }

  const columns = [
    { title: 'Ora', dataIndex: 'used_at', key: 'used_at', render: (v)=> v?.slice(11,16) },
    { title: 'Utente', dataIndex: 'user_name', key: 'user_name' },
    { title: 'Email', dataIndex: 'user_email', key: 'user_email' },
    { title: 'Piano', dataIndex: 'plan_name', key: 'plan_name' },
    { title: 'Esito', dataIndex: 'status', key: 'status', render: (s)=> <Tag color={s==='checked_in'?'green':'red'}>{s}</Tag> },
  ]

  return (
    <div>
      <GymHeader gym={gym} />
      <Card className="content-card" style={{ marginBottom: 16 }}>
        <Space>
          <span>Data:</span>
          <DatePicker value={date} onChange={(d)=>{ setDate(d); load(d, q) }} />
          <Input.Search allowClear placeholder="Cerca nome/email" value={q}
            onChange={(e)=>setQ(e.target.value)} onSearch={()=>load(date, q)} />
        </Space>
      </Card>
      <Card className="content-card">
        <Table rowKey={(r)=>r.id} columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  )
}
