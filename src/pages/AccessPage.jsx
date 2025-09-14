import React, { useState } from 'react'
import { Card, Form, Input, Button, Result, Descriptions, Space, message } from 'antd'
import { validateAccessAndFetchUser } from '../services/api'

const DEVICE_ID = localStorage.getItem('pp_device_id') || 'desk-1' // imposta il tuo device

export default function AccessPage(){
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function onFinish(v){
    try {
      setLoading(true)
      const data = await validateAccessAndFetchUser(v.token_raw, DEVICE_ID)
      setResult(data)
    } catch (e) {
      message.error(e?.response?.data?.error || 'Errore di rete')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="content-card">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Token utente" name="token_raw" rules={[{ required:true, message:'Inserisci token' }]}>
          <Input placeholder="incolla/scansiona token" allowClear />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>Valida</Button>
          <Button onClick={()=>setResult(null)}>Reset</Button>
        </Space>
      </Form>

      {result && (
        <div style={{ marginTop: 16 }}>
          {result.granted ? (
            <>
              <Result status="success" title="Accesso consentito" subTitle={`ID utente: ${result.id_user}`} />
              <Card>
                <Descriptions title="Utente" bordered size="small" column={1}>
                  {Object.entries(result.user || {}).map(([k,v]) => (
                    <Descriptions.Item key={k} label={k}>{String(v)}</Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            </>
          ) : (
            <Result status="error" title="Accesso negato" subTitle={result.reason || 'Token non valido'} />
          )}
        </div>
      )}
    </Card>
  )
}
