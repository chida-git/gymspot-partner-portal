import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Switch } from 'antd'
export default function PlanEditModal({ open, onCancel, onSubmit, initial }){
  const [form] = Form.useForm()
  useEffect(() => {
    if (open) form.setFieldsValue({
      price_eur: Number((initial?.price_cents || 0) / 100),
      freeze_max_days: initial?.freeze_max_days || 0,
      visible: true
    })
  }, [open, initial])
  return (
    <Modal title={`Modifica piano: ${initial?.name || ''}`} open={open} onCancel={onCancel}
           onOk={()=>form.submit()} okText="Salva" cancelText="Annulla">
      <Form form={form} layout="vertical" onFinish={(v)=>onSubmit({
        price_cents: Math.round((v.price_eur || 0) * 100),
        freeze_max_days: v.freeze_max_days || 0,
        visible: v.visible ? 1 : 0
      })}>
        <Form.Item label="Prezzo (EUR)" name="price_eur" rules={[{ required: true, message: 'Inserisci un prezzo' }]}>
          <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Giorni freeze max" name="freeze_max_days">
          <InputNumber min={0} max={90} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Visibile in app" name="visible" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}