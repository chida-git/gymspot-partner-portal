import React from 'react'
import { Card, Table } from 'antd'
const columns = [
  { title: 'Periodo', dataIndex: 'period', key: 'period' },
  { title: 'Incasso lordo', dataIndex: 'gross', key: 'gross' },
  { title: 'Fee', dataIndex: 'fee', key: 'fee' },
  { title: 'Netto', dataIndex: 'net', key: 'net' },
  { title: 'Stato', dataIndex: 'status', key: 'status' },
]
const data = [] // TODO: wire to /payouts when exposed
export default function PayoutsPage(){ return (<Card className="content-card"><Table rowKey={(r)=>r.id || r.period} columns={columns} dataSource={data} pagination={false} /></Card>) }