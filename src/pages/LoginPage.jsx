import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { partnerLogin } from '../services/api.js'
const { Title, Text } = Typography

export default function LoginPage(){
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const gymId = Number(sp.get('gym_id') || 1)
  const redirect = sp.get('redirect') || `/plans?gym_id=${gymId}`

  async function onFinish(values){
    try {
      setLoading(true)
      const { token, partner } = await partnerLogin(values.email, values.password)
      login(token, partner)
      navigate(redirect, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f7f9' }}>
      <Card style={{ width: 360, borderRadius: 12 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Accedi</Title>
        <Text type="secondary">Portale Partner – Milano Pilot</Text>
        <Form layout="vertical" style={{ marginTop: 16 }} onFinish={onFinish}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Inserisci email' }]}>
            <Input type="email" placeholder="nome@palestra.it" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Inserisci password' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>Entra</Button>
        </Form>
      </Card>
    </div>
  )
}
