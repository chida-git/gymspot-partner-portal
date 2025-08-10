import React from 'react'
import { Modal, Form, Input, InputNumber, Select } from 'antd'

const PLAN_TYPES = [
  { value: 'monthly', label: 'Mensile' },
  { value: 'annual', label: 'Annuale' },
  { value: 'pack', label: 'Pack ingressi' },
  { value: 'daypass', label: 'Day Pass' },
  { value: 'trial', label: 'Trial' },
]

export default function PlanCreateModal({ open, onCancel, onSubmit }){
  const [form] = Form.useForm()
  return (
    <Modal title="Nuovo piano" open={open} onCancel={onCancel} onOk={()=>form.submit()} okText="Crea">
      <Form form={form} layout="vertical" onFinish={(v)=>onSubmit({
        name: v.name,
        plan_type: v.plan_type,
        price_cents: Math.round((v.price_eur || 0) * 100),
        duration_days: v.duration_days || null,
        entries_total: v.entries_total || null,
        access_per_day: v.access_per_day || null,
        freeze_max_days: v.freeze_max_days || 0,
        visible: 1
      })}>
        <Form.Item label="Nome" name="name" rules={[{ required: true, message: 'Inserisci nome piano' }]}>
          <Input placeholder="Mensile, Carnet 10, ..." />
        </Form.Item>
        <Form.Item label="Tipo" name="plan_type" rules={[{ required: true }]}>
          <Select options={PLAN_TYPES} />
        </Form.Item>
        <Form.Item label="Prezzo (EUR)" name="price_eur" rules={[{ required: true }]}>
          <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Durata (giorni)" name="duration_days">
          <InputNumber min={1} max={400} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Ingressi totali (pack)" name="entries_total">
          <InputNumber min={1} max={200} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Accessi per giorno" name="access_per_day">
          <InputNumber min={1} max={5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Freeze max (gg)" name="freeze_max_days">
          <InputNumber min={0} max={90} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
