import React, { useMemo } from 'react'
import { Layout, Menu } from 'antd'
import { Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppstoreOutlined, DollarOutlined, ScheduleOutlined, ToolOutlined } from '@ant-design/icons'
import PlansPage from './pages/PlansPage.jsx'
import SlotsPage from './pages/SlotsPage.jsx'
import PayoutsPage from './pages/PayoutsPage.jsx'
import CheckinsPage from './pages/CheckinsPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import HeaderBar from './components/HeaderBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
const { Sider, Content } = Layout
export default function App() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const selected = useMemo(() => {
    const p = location.pathname
    if (p.startsWith('/plans')) return 'plans'
    if (p.startsWith('/slots')) return 'slots'
    if (p.startsWith('/payouts')) return 'payouts'
    return 'overview'
  }, [location.pathname])
  const gymId = Number(sp.get('gym_id') || 1)
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} breakpoint="lg">
        <div style={{ height: 64, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>Partner Portal</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selected]}
          onClick={(e) => navigate(`/${e.key}?gym_id=${gymId}`)}
          items={[
            { key: 'overview', icon: <AppstoreOutlined/>, label: 'Oggi' },
            { key: 'plans', icon: <ToolOutlined/>, label: 'Piani & Prezzi' },
            { key: 'slots', icon: <ScheduleOutlined/>, label: 'Slot & Capienze' },
            { key: 'payouts', icon: <DollarOutlined/>, label: 'Payout' },
            { key: 'checkins', icon: <ScheduleOutlined/>, label: 'Check-in oggi' }
          ]}
        />
      </Sider>
      <Layout>
        <HeaderBar />
        <Content className="page">
          <Routes>
            <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
            <Route path="/overview" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
            <Route path="/slots" element={<ProtectedRoute><SlotsPage /></ProtectedRoute>} />
            <Route path="/payouts" element={<ProtectedRoute><PayoutsPage /></ProtectedRoute>} />
            <Route path="/checkins" element={<ProtectedRoute><CheckinsPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}