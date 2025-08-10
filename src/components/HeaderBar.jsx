import React from 'react'
import { Layout, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
export default function HeaderBar(){
  return (
    <Layout.Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <div style={{ fontWeight:600 }}>Gestione palestra</div>
        <Space>
          <Button onClick={()=>window.location.reload()} icon={<ReloadOutlined/>}>Aggiorna</Button>
          <Button href="/docs" target="_blank">API Docs</Button>
        </Space>
      </div>
    </Layout.Header>
  )
}