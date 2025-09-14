import React, { useState } from 'react'
import { Card, Form, Input, Button, Result, Descriptions, Space, message } from 'antd'
import { validateAccessAndFetchUser, getUserFull } from '../services/api'

export default function AccessPage(){
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function onFinish(v){
    try {
      setLoading(true)
      // 1) valida token -> { granted, id_user, device_id, user? }
      const base = await validateAccessAndFetchUser(v.token_raw)

      if (!base?.granted) {
        setResult(base)
        return
      }

      // 2) dati utente + abbonamento dal BE
      const full = await getUserFull(base.id_user)
      setResult({ ...base, ...full })
    } catch (e) {
      message.error(e?.response?.data?.error || e.message || 'Errore di rete')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="content-card">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Token utente"
          name="token_raw"
          rules={[{ required:true, message:'Inserisci token' }]}
        >
          <Input placeholder="incolla/scansiona token" allowClear />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>Valida</Button>
          <Button onClick={()=>setResult(null)} disabled={loading}>Reset</Button>
        </Space>
      </Form>

      {result && (
        <div style={{ marginTop: 16 }}>
          {result.granted ? (
            <>
              <Result
                status="success"
                title="Accesso consentito"
                subTitle={`ID utente: ${result.id_user}${result.device_id ? ` • Device: ${result.device_id}` : ''}`}
              />
              {result.user ? (
                <Card style={{ marginBottom: 12 }}>
                  <Descriptions title="Utente" bordered size="small" column={1}>
                    <Descriptions.Item label="Nome">{result.user.name}</Descriptions.Item>
                    <Descriptions.Item label="Cognome">{result.user.surname}</Descriptions.Item>
                    <Descriptions.Item label="Email">{result.user.mail}</Descriptions.Item>
                  </Descriptions>
                </Card>
              ) : (
                <Card style={{ marginBottom: 12 }}><i>Nessun dato utente disponibile</i></Card>
              )}

              {result.subscription ? (
                <Card>
                  <Descriptions title="Abbonamento" bordered size="small" column={1}>
                    <Descriptions.Item label="Piano">{result.subscription.plan_name}</Descriptions.Item>
                    <Descriptions.Item label="Tipo">{result.subscription.plan_type}</Descriptions.Item>
                    <Descriptions.Item label="Stato">{result.subscription.status}</Descriptions.Item>
                    <Descriptions.Item label="Inizio">
                      {result.subscription.start_at?.slice(0,16) || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Fine">
                      {result.subscription.end_at?.slice(0,16) || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ingressi rimanenti">
                      {result.subscription.entries_remaining ?? '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Prezzo">
                      {typeof result.subscription.price_cents === 'number'
                        ? (result.subscription.price_cents/100).toFixed(2) + ' ' + (result.subscription.currency || 'EUR')
                        : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ) : (
                <Card><i>Nessun abbonamento trovato per questa palestra.</i></Card>
              )}
            </>
          ) : (
            <Result
              status="error"
              title="Accesso negato"
              subTitle={result.reason || 'Token non valido'}
            />
          )}
        </div>
      )}
    </Card>
  )
}
