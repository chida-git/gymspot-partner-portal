import React, { useMemo, useState } from 'react'
import { Table, Tag, Button, Space, Popconfirm } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import PlanEditModal from './PlanEditModal.jsx'
const euro = (cents) => (cents != null ? (cents / 100).toFixed(2) + ' €' : '-')
export default function PlansTable({ plans, onUpdate, onDelete }){
  const [editing, setEditing] = useState(null)
  const columns = useMemo(() => [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Tipo', dataIndex: 'plan_type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Prezzo', dataIndex: 'price_cents', key: 'price', render: euro },
    { title: 'Durata (giorni)', dataIndex: 'duration_days', key: 'dur' },
    { title: 'Ingressi (pack)', dataIndex: 'entries_total', key: 'entries' },
    { title: 'Freeze max (gg)', dataIndex: 'freeze_max_days', key: 'freeze' },
    { title: 'Azioni', key: 'actions', render: (_, rec) => (<Space><Button icon={<EditOutlined/>} onClick={()=>setEditing(rec)}>Modifica</Button><Popconfirm title='Confermi eliminazione?' onConfirm={()=>onDelete(rec)}><Button danger>Elimina</Button></Popconfirm></Space>) }
  ], [])
  return (<>
    <Table rowKey="id" columns={columns} dataSource={plans} pagination={false} />
    <PlanEditModal open={!!editing} initial={editing} onCancel={()=>setEditing(null)}
      onSubmit={async (payload)=>{ await onUpdate(editing.id, payload); setEditing(null); }}/>
  </>)
}