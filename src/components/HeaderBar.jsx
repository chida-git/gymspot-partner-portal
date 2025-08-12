import React from 'react'
import { Layout, Button, Space } from 'antd'
import { ReloadOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function HeaderBar(){
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const gymId = sp.get('gym_id') || 1

  function doLogout(){
    logout()
    navigate(`/login?gym_id=${gymId}`, { replace: true })
  }

  return (
    <Layout.Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <div style={{ fontWeight:600 }}>Gestione palestra</div>
        <Space>
          <Button onClick={()=>window.location.reload()} icon={<ReloadOutlined/>}>Aggiorna</Button>
          <Button href="/docs" target="_blank">API Docs</Button>
          <Button danger icon={<LogoutOutlined/>} onClick={doLogout}>Logout</Button>
        </Space>
      </div>
    </Layout.Header>
  )
}