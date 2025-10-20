import React, { useEffect, useState } from 'react'
import { Card, Typography } from 'antd';
import { getGymDetail } from "../services/api";

const { Title, Text } = Typography

export default function GymHeader({ gymId }){

  const [gym, setGym] = useState(null);

   useEffect(() => { (async () => {
        try {
          const d = await getGymDetail(gymId); setGym(d.gym)
        } catch (e) { message.error(e.message || 'Errore di rete') }
      })() }, [gymId])

  return (
    <Card style={{ marginBottom: 16, borderRadius: 12 }}>
      <Title level={4} style={{ margin: 0 }}>{gym?.name || 'Palestra'}</Title>
      <Text type="secondary">Gestione piani, prezzi e capienze</Text>
    </Card>
  )
}