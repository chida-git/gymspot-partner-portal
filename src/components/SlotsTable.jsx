import React from 'react'
import { Table, Switch, InputNumber, Button, Space } from 'antd'
export default function SlotsTable({ slots, loading, onChangeRow, onSaveRow }){
  const columns = [
    { title: 'Orario', key: 'time', render: (_, r) => `${r.time_from?.slice(0,5)}–${r.time_to?.slice(0,5)}` },
    { title: 'Capienza', dataIndex: 'capacity', key: 'cap', render: (v, r) => (<InputNumber min={0} value={r.capacity} onChange={(val)=>onChangeRow(r.id, { capacity: val })} />) },
    { title: 'Disponibili', dataIndex: 'available', key: 'avail', render: (v, r) => (<InputNumber min={0} value={r.available} onChange={(val)=>onChangeRow(r.id, { available: val })} />) },
    { title: 'Attivo', dataIndex: 'is_active', key: 'active', render: (v, r) => (<Switch checked={!!r.is_active} onChange={(val)=>onChangeRow(r.id, { is_active: val ? 1 : 0 })} />) },
    { title: 'Azioni', key: 'actions', render: (_, r) => (<Space><Button type="primary" onClick={()=>onSaveRow(r.id, r)}>Salva</Button></Space>) },
  ]
  return <Table rowKey="id" columns={columns} dataSource={slots} loading={loading} pagination={false} />
}