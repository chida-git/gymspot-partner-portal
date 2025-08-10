import React from 'react'
import { Card, Typography } from 'antd'
const { Title, Text } = Typography
export default function GymHeader({ gym }){
  return (
    <Card style={{ marginBottom: 16, borderRadius: 12 }}>
      <Title level={4} style={{ margin: 0 }}>{gym?.name || 'Palestra'}</Title>
      <Text type="secondary">Gestione piani, prezzi e capienze</Text>
    </Card>
  )
}