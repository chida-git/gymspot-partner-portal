import React from 'react'
import { Card, Statistic, Row, Col } from 'antd'
export default function OverviewPage(){
  return (
    <Row gutter={16}>
      <Col xs={24} md={8}><Card className="content-card"><Statistic title="Iscritti attivi" value={128} /></Card></Col>
      <Col xs={24} md={8}><Card className="content-card"><Statistic title="Check-in oggi" value={42} /></Card></Col>
      <Col xs={24} md={8}><Card className="content-card"><Statistic title="Incasso settimana" prefix="€" value={1540} /></Card></Col>
    </Row>
  )
}