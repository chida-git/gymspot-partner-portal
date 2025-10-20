import React, { useMemo, useState } from 'react'
import { Card, Statistic, Row, Col, Typography, Divider, DatePicker, Select, Space, Button, Segmented, Tag } from 'antd'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import GymHeader from '../components/GymHeader.jsx';

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker

// === DATI DI ESEMPIO ===
// Ogni vendita ha: data (YYYY-MM-DD), periodo di validità, prezzo
const sampleSales = [
  // Ottobre 2025
  { date: '2025-09-29', validity: 'Settimanale', price: 25 },
  { date: '2025-09-30', validity: 'Mensile', price: 60 },
  { date: '2025-10-01', validity: 'Mensile', price: 60 },
  { date: '2025-10-01', validity: 'Trimestrale', price: 160 },
  { date: '2025-10-02', validity: 'Annuale', price: 500 },
  { date: '2025-10-03', validity: 'Settimanale', price: 25 },
  { date: '2025-10-05', validity: 'Mensile', price: 60 },
  { date: '2025-10-06', validity: 'Mensile', price: 60 },
  { date: '2025-10-07', validity: 'Trimestrale', price: 160 },
  { date: '2025-10-08', validity: 'Settimanale', price: 25 },
  { date: '2025-10-09', validity: 'Mensile', price: 60 },
  { date: '2025-10-10', validity: 'Trimestrale', price: 160 },
  { date: '2025-10-11', validity: 'Annuale', price: 500 },
  { date: '2025-10-12', validity: 'Settimanale', price: 25 },
  { date: '2025-10-13', validity: 'Mensile', price: 60 },
  { date: '2025-10-14', validity: 'Mensile', price: 60 },
  { date: '2025-10-15', validity: 'Settimanale', price: 25 },
  { date: '2025-10-16', validity: 'Trimestrale', price: 160 },
  { date: '2025-10-17', validity: 'Mensile', price: 60 },
  { date: '2025-10-18', validity: 'Settimanale', price: 25 },
  { date: '2025-10-19', validity: 'Annuale', price: 500 },
  { date: '2025-10-20', validity: 'Mensile', price: 60 },
  { date: '2025-10-21', validity: 'Trimestrale', price: 160 },
  { date: '2025-10-22', validity: 'Settimanale', price: 25 },
  { date: '2025-10-23', validity: 'Mensile', price: 60 },
  { date: '2025-10-24', validity: 'Mensile', price: 60 },
]

// === UTIL ===
function toDate(d) {
  return d instanceof Date ? d : new Date(d)
}

// ISO week number
function getISOWeek(date) {
  const d = toDate(date)
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target - yearStart) / 86400000 + 1) / 7)
  return weekNo
}
function getISOWeekYear(date) {
  const d = toDate(date)
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  return target.getUTCFullYear()
}
function weekKey(date) {
  const w = getISOWeek(date)
  const y = getISOWeekYear(date)
  const ww = w.toString().padStart(2, '0')
  return `${y}-W${ww}`
}
function monthKey(date) {
  const d = toDate(date)
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${mm}`
}

function aggregate(sales, granularity = 'week') {
  const validitySet = new Set()
  const byKey = new Map()
  const keyFn = granularity === 'week' ? weekKey : monthKey

  for (const s of sales) {
    validitySet.add(s.validity)
    const k = keyFn(s.date)
    if (!byKey.has(k)) byKey.set(k, { key: k, _revenue: 0 })
    const row = byKey.get(k)
    row[s.validity] = (row[s.validity] || 0) + 1
    row._revenue += s.price
  }

  const validityTypes = Array.from(validitySet)
  const count = Array.from(byKey.values())
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((r) => ({ ...r, total: validityTypes.reduce((acc, k) => acc + (r[k] || 0), 0) }))

  const revenue = count.map((r) => ({ key: r.key, revenue: r._revenue }))

  return { validityTypes, count, revenue }
}

export default function OverviewPage() {
  // === STATE FILTRI ===
  const [granularity, setGranularity] = useState('week') // 'week' | 'month'
  const [validityFilter, setValidityFilter] = useState(['Settimanale', 'Mensile', 'Trimestrale', 'Annuale'])
  const [dateRange, setDateRange] = useState(null) // [dayjs, dayjs]

  const filteredSales = useMemo(() => {
    return sampleSales.filter((s) => {
      const inValidity = validityFilter.includes(s.validity)
      const inRange = !dateRange
        ? true
        : (new Date(s.date) >= dateRange[0].toDate() && new Date(s.date) <= dateRange[1].toDate())
      return inValidity && inRange
    })
  }, [validityFilter, dateRange])

  const { validityTypes, count, revenue } = useMemo(
    () => aggregate(filteredSales, granularity),
    [filteredSales, granularity]
  )

  const lastRevenue = revenue.length ? revenue[revenue.length - 1].revenue : 0
  const activeMembers = 128 // Placeholder
  const todayCheckins = 42 // Placeholder

  const validityOptions = [
    { label: 'Settimanale', value: 'Settimanale' },
    { label: 'Mensile', value: 'Mensile' },
    { label: 'Trimestrale', value: 'Trimestrale' },
    { label: 'Annuale', value: 'Annuale' },
  ]

  const resetFilters = () => {
    setGranularity('week')
    setValidityFilter(validityOptions.map((o) => o.value))
    setDateRange(null)
  }

  return (
    <div><GymHeader gymId={1} />
    <div style={{ display: 'grid', gap: 16 }}>
      {/* KPI */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="content-card">
            <Statistic title="Iscritti attivi" value={activeMembers} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="content-card">
            <Statistic title="Check-in oggi" value={todayCheckins} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="content-card">
            <Statistic title="Incasso (ultimo periodo)" prefix="€" value={lastRevenue} />
          </Card>
        </Col>
      </Row>

      {/* FILTRI MODERNI */}
      <Card className="content-card" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <Space size={[12, 12]} wrap align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size={[12, 12]} wrap>
            <Segmented
              options={[
                { label: 'Settimana', value: 'week' },
                { label: 'Mese', value: 'month' },
              ]}
              value={granularity}
              onChange={setGranularity}
            />

            <Select
              mode="multiple"
              allowClear
              value={validityFilter}
              onChange={setValidityFilter}
              placeholder="Periodo di validità"
              options={validityOptions}
              style={{ minWidth: 260 }}
              maxTagCount="responsive"
            />

            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              allowEmpty={[true, true]}
              format="YYYY-MM-DD"
            />
          </Space>

          <Space>
            <Tag color="blue">Vendite: {filteredSales.length}</Tag>
            <Button onClick={resetFilters}>Reset</Button>
          </Space>
        </Space>
      </Card>

      {/* GRAFICO 1: Conteggi stackati per periodo */}
      <Card className="content-card" style={{ marginTop: 8 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Abbonamenti venduti per {granularity === 'week' ? 'settimana' : 'mese'} (stack per periodo di validità)
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Dati di esempio aggregati per {granularity === 'week' ? 'settimana ISO (YYYY-WW)' : 'mese (YYYY-MM)'}.
        </Paragraph>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={count} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Legend />
              {validityTypes
                .filter((v) => validityFilter.includes(v))
                .map((v) => (
                  <Bar key={v} dataKey={v} stackId="count" />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* GRAFICO 2: Incasso per periodo */}
      <Card className="content-card">
        <Title level={4} style={{ marginBottom: 0 }}>
          Incasso per {granularity === 'week' ? 'settimana' : 'mese'} (venduto nel periodo)
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Somma dei ricavi per {granularity === 'week' ? 'settimana' : 'mese'}. Dati di esempio.
        </Paragraph>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={revenue} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis />
              <RTooltip formatter={(value) => [`€ ${value}`, 'Incasso']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Divider />
      <Paragraph type="secondary" style={{ margin: 0 }}>
        * Sostituisci <code>sampleSales</code> con i tuoi dati reali (lista di vendite con <code>date</code>, <code>validity</code> e <code>price</code>). I grafici si aggiornano automaticamente in base ai filtri.
      </Paragraph>
    </div>
    </div>
  )
}
