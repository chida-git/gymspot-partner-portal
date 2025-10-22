import React, { useMemo } from 'react'
import { Layout, Menu } from 'antd'
import { Route, Routes, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { DollarOutlined, ScheduleOutlined, ToolOutlined, SafetyOutlined, ProductOutlined, OrderedListOutlined, AppstoreAddOutlined, AreaChartOutlined, TagsOutlined, FullscreenOutlined, MailOutlined } from '@ant-design/icons'
import PlansPage from './pages/PlansPage.jsx'
import SlotsPage from './pages/SlotsPage.jsx'
import PayoutsPage from './pages/PayoutsPage.jsx'
import CheckinsPage from './pages/CheckinsPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import HeaderBar from './components/HeaderBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AccessPage from './pages/AccessPage.jsx'
import GymProfilePage from './pages/GymProfilePage'
import { useGymRoutesConfig } from './hooks/useGymRoutesConfig'
import CoursesPage from "./pages/CoursesPage.jsx";
import ExtrasPage from './pages/ExtrasPage.jsx';
import EquipmentPage from './pages/EquipmentPage.jsx';
import GymStructurePage from './pages/GymStructurePage.jsx';
import NewsletterPage from './pages/NewsletterPage.jsx';

const { Sider, Content } = Layout

// Gate per bloccare l’accesso a rotte disattivate
function FeatureGate({ routeKey, enabledMap, children }) {
  console.log(enabledMap)
  console.log(routeKey)
  if (!enabledMap?.[routeKey]) return <Navigate to="/overview" replace />
  return children
}

export default function App() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const selected = useMemo(() => {
    const p = location.pathname
    if (p.startsWith('/plans')) return 'plans'
    if (p.startsWith('/slots')) return 'slots'
    if (p.startsWith('/payouts')) return 'payouts'
    if (p.startsWith('/checkins')) return 'checkins'
    if (p.startsWith('/access')) return 'access'
    if (p.startsWith('/profile')) return 'profile'
    if (p.startsWith('/courses')) return 'courses'
    if (p.startsWith('/extras')) return 'extras'
    if (p.startsWith('/equipment')) return 'equipment'
    if (p.startsWith('/capacity')) return 'capacity'
    if (p.startsWith('/newsletter')) return 'newsletter'
    return 'overview'
  }, [location.pathname])

  const gymId = Number(sp.get('gym_id') || 1)

  // prende config + stato caricamento dalla hook
  const { config: cfg, loading: loadingCfg } = useGymRoutesConfig(gymId)

  const menuItems = [
    { key: 'overview', icon: <AreaChartOutlined/>, label: 'Oggi' },
    { key: 'profile',  icon: <ProductOutlined/>,  label: 'Profilo' },
    { key: 'capacity',   icon: <FullscreenOutlined/>,   label: 'Capienza' },
    { key: 'plans',    icon: <TagsOutlined/>,     label: 'Piani & Prezzi' },
    { key: 'equipment',    icon: <ToolOutlined/>,     label: 'Attrezzatura' },
    { key: 'courses',  icon: <OrderedListOutlined/>,   label: 'Corsi' },
    { key: 'extras',   icon: <AppstoreAddOutlined/>,   label: 'Extra' },
    { key: 'slots',    icon: <ScheduleOutlined/>, label: 'Slot & Capienze' },
    { key: 'payouts',  icon: <DollarOutlined/>,   label: 'Payout' },
    { key: 'checkins', icon: <ScheduleOutlined/>, label: 'Check-in oggi' },
    { key: 'newsletter',    icon: <MailOutlined/>,     label: 'Newsletter' },
    { key: 'access',   icon: <SafetyOutlined/>,   label: 'Validazione accesso' }
  ]

  const visibleItems = loadingCfg ? menuItems : menuItems.filter(i => !!cfg[i.key])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} breakpoint="lg">
        <div style={{ height: 64, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>
          Partner Portal
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          onClick={(e) => navigate(`/${e.key}?gym_id=${gymId}`)}
          items={visibleItems}
        />
      </Sider>

      <Layout>
        <HeaderBar />
        <Content className="page">
          {loadingCfg && <div style={{ padding: 16 }}>Caricamento impostazioni…</div>}

          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <FeatureGate routeKey="overview" enabledMap={cfg}>
                  <OverviewPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/overview" element={
              <ProtectedRoute>
                <FeatureGate routeKey="overview" enabledMap={cfg}>
                  <OverviewPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/capacity" element={
              <ProtectedRoute>
                <FeatureGate routeKey="capacity" enabledMap={cfg}>
                  <GymStructurePage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/plans" element={
              <ProtectedRoute>
                <FeatureGate routeKey="plans" enabledMap={cfg}>
                  <PlansPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/equipment" element={
              <ProtectedRoute>
                <FeatureGate routeKey="equipment" enabledMap={cfg}>
                  <EquipmentPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/courses" element={
              <ProtectedRoute>
                <FeatureGate routeKey="courses" enabledMap={cfg}>
                  <CoursesPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

             <Route path="/extras" element={
              <ProtectedRoute>
                <FeatureGate routeKey="extras" enabledMap={cfg}>
                  <ExtrasPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/slots" element={
              <ProtectedRoute>
                <FeatureGate routeKey="slots" enabledMap={cfg}>
                  <SlotsPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/payouts" element={
              <ProtectedRoute>
                <FeatureGate routeKey="payouts" enabledMap={cfg}>
                  <PayoutsPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/checkins" element={
              <ProtectedRoute>
                <FeatureGate routeKey="checkins" enabledMap={cfg}>
                  <CheckinsPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/access" element={
              <ProtectedRoute>
                <FeatureGate routeKey="access" enabledMap={cfg}>
                  <AccessPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/newsletter" element={
              <ProtectedRoute>
                <FeatureGate routeKey="newsletter" enabledMap={cfg}>
                  <NewsletterPage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="/profile" element={
              <ProtectedRoute>
                <FeatureGate routeKey="profile" enabledMap={cfg}>
                  <GymProfilePage />
                </FeatureGate>
              </ProtectedRoute>
            }/>

            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
