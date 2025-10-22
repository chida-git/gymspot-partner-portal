import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, DatePicker, Empty, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import {
  syncMarketingContacts,
  getTemplates, createTemplate,
  getCampaigns, createCampaign, markCampaignReady, updateCampaign,
  getOffers, attachOffersToCampaign,
  getMarketingContacts, setCampaignRecipients
} from '../services/api'

const { Title, Text } = Typography
const { Option } = Select

// ---------- Modal: Nuovo Template ----------
function TemplateModal({ open, onClose, gymId, onCreated }){
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    try{
      const v = await form.validateFields()
      setLoading(true)
      await createTemplate({ gym_id: gymId, ...v })
      form.resetFields()
      onCreated?.()
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal
      title="Crea Template"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={loading}
      width={900}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Nome" rules={[{ required:true }]}>
          <Input placeholder="Promo Settembre" />
        </Form.Item>
        <Form.Item name="subject" label="Oggetto (default)">
          <Input placeholder="Allenati con -25% questa settimana" />
        </Form.Item>
        <Form.Item name="html" label="HTML" rules={[{ required:true }]}>
          <Input.TextArea rows={12} placeholder="<h1>GymSpot</h1><p>Testo...</p>" />
        </Form.Item>
        <Form.Item name="text" label="Testo (fallback)">
          <Input.TextArea rows={4} placeholder="Versione testo semplice" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ---------- Modal: Nuova Campagna ----------
function CampaignModal({ open, onClose, gymId, templates, onCreated }){
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    const v = await form.validateFields()
    setLoading(true)
    try{
      const payload = {
        gym_id: gymId,
        name: v.name,
        subject: v.subject,
        from_name: v.from_name || 'GymSpot',
        from_email: 'noreply@gymspot.it', // fisso Aruba
        template_id: v.template_id || null,
        content_html: v.content_html || null,
        scheduled_at: v.scheduled_at ? v.scheduled_at.toISOString() : null
      }
      await createCampaign(payload)
      onCreated?.()
      onClose()
      form.resetFields()
    } finally { setLoading(false) }
  }

  return (
    <Modal
      title="Crea Campagna"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={loading}
      width={900}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Nome" rules={[{ required:true }]}>
          <Input placeholder="Promo Black Friday" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="subject" label="Oggetto" rules={[{ required:true }]}>
              <Input placeholder="-30% sugli abbonamenti annuali" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="from_name" label="Mittente (nome visualizzato)">
              <Input placeholder="GymSpot - Palestra X" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="template_id" label="Template">
          <Select allowClear placeholder="Seleziona un template">
            {templates.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="content_html" label="HTML (se non usi template)">
          <Input.TextArea rows={8} placeholder="<h2>Offerta...</h2>" />
        </Form.Item>
        <Form.Item name="scheduled_at" label="Programma invio (opzionale)">
          <DatePicker showTime style={{ width:'100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// ---------- Modal: Collegare Offerte ----------
function OfferAttachModal({ open, onClose, gymId, campaign, onAttached }){
  const [loading, setLoading] = useState(false)
  const [offers, setOffers] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!open) return
    getOffers(gymId, { active_only:true, limit:200 }).then(setOffers)
  }, [open, gymId])

  const onSubmit = async () => {
    if (!selected.length) return onClose()
    setLoading(true)
    try{
      await attachOffersToCampaign(campaign.id, selected)
      onAttached?.()
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal
      title={`Collega offerte a: ${campaign?.name}`}
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={loading}
    >
      <Select
        mode="multiple"
        style={{ width:'100%' }}
        placeholder="Seleziona offerte"
        value={selected}
        onChange={setSelected}
        optionFilterProp="label"
      >
        {offers.map(o => (
          <Option
            key={o.id}
            value={o.id}
            label={`${o.name} (${o.offer_type})`}
          >
            {o.name} <Tag>{o.offer_type}</Tag>{o.plan_id ? <Tag color="blue">piano #{o.plan_id}</Tag> : <Tag color="gold">generica</Tag>}
          </Option>
        ))}
      </Select>
    </Modal>
  )
}

// ---------- Pagina principale ----------
export default function NewsletterPage(){
  // recupero gymId da contesto/storage come fai altrove
  const gymId = Number(localStorage.getItem('gym_id') || 1)

  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [campaigns, setCampaigns] = useState([])

  const [tplOpen, setTplOpen] = useState(false)
  const [campOpen, setCampOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactOnlySubscribed, setContactOnlySubscribed] = useState(true)
  const [selectedContactKeys, setSelectedContactKeys] = useState([])
  const [currentCampaignId, setCurrentCampaignId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try{
      const [t, c] = await Promise.all([
        getTemplates(gymId),
        getCampaigns(gymId)
      ])
      setTemplates(t)
      setCampaigns(c)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [gymId])

    const fetchContacts = async () => {
    setContactsLoading(true)
    try{
      const list = await getMarketingContacts(gymId, {
        search: contactSearch,
        subscribed: contactOnlySubscribed
      })
      setContacts(list)
    } finally { setContactsLoading(false) }
  }

  useEffect(() => { fetchContacts() }, [gymId]) // primo load

  const contactColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Nome', dataIndex: 'full_name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Telefono', dataIndex: 'phone', width: 140 },
    { title: 'Opt-in', dataIndex: 'subscribed', width: 90, render: v => v ? <Tag color="green">OK</Tag> : <Tag>NO</Tag> },
    { title: 'Tag', dataIndex: 'tags', render: t => (Array.isArray(t) ? t : (t ? JSON.parse(t) : [])).
        map((x, i)=><Tag key={i}>{x}</Tag>) }
  ]

  const rowSelection = {
    selectedRowKeys: selectedContactKeys,
    onChange: setSelectedContactKeys,
  }

  const handleAttachSelected = async (replace=false) => {
    if (!currentCampaignId) { return Modal.warning({ title:'Seleziona una campagna', content:'Scegli la campagna su cui aggiungere i destinatari.' }) }
    if (selectedContactKeys.length === 0) { return Modal.info({ title:'Nessun contatto selezionato' }) }
    await setCampaignRecipients(currentCampaignId, selectedContactKeys, { replace })
    // dopo l'assegnazione aggiorno le campagne per eventuali conteggi lato BE
    await fetchAll()
    setSelectedContactKeys([])
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Nome', dataIndex: 'name' },
    { title: 'Oggetto', dataIndex: 'subject', ellipsis: true },
    {
      title: 'Stato',
      dataIndex: 'status',
      width: 120,
      render: s => {
        const color = s==='sent'?'green': s==='sending'?'blue': s==='ready'?'gold': 'default'
        return <Tag color={color}>{s}</Tag>
      }
    },
    { title: 'Schedulata', dataIndex: 'scheduled_at', width: 170, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text> },
    { title: 'Creata', dataIndex: 'created_at', width: 170, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: 'Azioni',
      key: 'actions',
      width: 360,
      render: (_, row) => (
        <Space>
          <Button onClick={() => handleAttach(row)}>Collega offerte</Button>
          {row.status === 'draft' && (
            <Button type="primary" onClick={() => handleReady(row)}>OK (Ready)</Button>
          )}
          {row.status === 'scheduled' && (
            <Button onClick={() => updateCampaign(row.id, { status: 'ready' }).then(fetchAll)}>Forza Ready</Button>
          )}
          {row.status === 'sending' && <Tag color="blue">In invio…</Tag>}
          {row.status === 'sent' && <Tag color="green">Completata</Tag>}
        </Space>
      )
    }
  ]

  const handleSync = async () => {
    await syncMarketingContacts(gymId)
  }

  const handleReady = async (row) => {
    await markCampaignReady(row.id)
    fetchAll()
  }

  const handleAttach = (row) => {
    setSelectedCampaign(row)
    setOfferOpen(true)
  }

  return (
    <Space direction="vertical" size="large" style={{ width:'100%' }}>
      <Card>
        <Row gutter={[16,16]} align="middle">
          <Col flex="auto">
            <Title level={3} style={{ margin:0 }}>Marketing & Newsletter</Title>
            <Text type="secondary">Invio centralizzato da info@gymspot.it con rate limit 100/h</Text>
          </Col>
          <Col>
            <Space>
              <Button onClick={handleSync}>Sincronizza contatti</Button>
              <Button onClick={() => setTplOpen(true)}>Nuovo Template</Button>
              <Button type="primary" onClick={() => setCampOpen(true)}>Nuova Campagna</Button>
            </Space>
          </Col>
        </Row>
      </Card>

            <Card
        title="Contatti Marketing"
        extra={
          <Space>
            <Input.Search
              placeholder="Cerca nome/email/telefono"
              allowClear
              onSearch={() => fetchContacts()}
              onChange={e => setContactSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              value={contactOnlySubscribed ? 'subscribed' : 'all'}
              onChange={(v)=>{ setContactOnlySubscribed(v==='subscribed'); fetchContacts() }}
              options={[
                { label:'Solo Opt-in', value:'subscribed' },
                { label:'Tutti', value:'all' }
              ]}
              style={{ width: 140 }}
            />
            <Select
              placeholder="Campagna"
              style={{ width: 260 }}
              value={currentCampaignId}
              onChange={setCurrentCampaignId}
              allowClear
              options={campaigns.map(c=>({ label:`${c.name} (#${c.id})`, value:c.id }))}
            />
            <Button onClick={fetchContacts}>Refresh</Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            disabled={!currentCampaignId || selectedContactKeys.length===0}
            onClick={() => handleAttachSelected(false)}
          >
            Aggiungi ai destinatari (selezionati)
          </Button>
          <Button
            danger
            disabled={!currentCampaignId || selectedContactKeys.length===0}
            onClick={() => handleAttachSelected(true)}
          >
            Sostituisci destinatari con selezione
          </Button>
          <Text type="secondary">
            Selezionati: {selectedContactKeys.length}
          </Text>
        </Space>
        <Table
          rowKey="id"
          dataSource={contacts}
          columns={contactColumns}
          loading={contactsLoading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="Template" bodyStyle={{ paddingTop: 0 }}>
            {templates.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nessun template" />
            ) : (
              <Table
                rowKey="id"
                size="small"
                dataSource={templates}
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: 'ID', dataIndex: 'id', width: 70 },
                  { title: 'Nome', dataIndex: 'name' },
                  { title: 'Oggetto', dataIndex: 'subject', ellipsis: true },
                  { title: 'Ultimo aggiornamento', dataIndex: 'updated_at', width: 170, render:v=>v?dayjs(v).format('YYYY-MM-DD HH:mm'):'-' }
                ]}
              />
            )}
          </Card>
        </Col>

        <Col span={14}>
          <Card title="Campagne" extra={<Button onClick={fetchAll} loading={loading}>Refresh</Button>} bodyStyle={{ paddingTop: 0 }}>
            <Table
              rowKey="id"
              dataSource={campaigns}
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modali */}
      <TemplateModal
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        gymId={gymId}
        onCreated={fetchAll}
      />
      <CampaignModal
        open={campOpen}
        onClose={() => setCampOpen(false)}
        gymId={gymId}
        templates={templates}
        onCreated={fetchAll}
      />
      <OfferAttachModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        gymId={gymId}
        campaign={selectedCampaign}
        onAttached={fetchAll}
      />
    </Space>
  )
}
