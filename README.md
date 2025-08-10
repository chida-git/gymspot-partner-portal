# Partner Portal (Ant Design) – React + Vite
## Struttura
```
partner-portal-antd/
├─ index.html
├─ package.json
├─ vite.config.js
└─ src/
   ├─ App.jsx
   ├─ main.jsx
   ├─ styles.css
   ├─ services/
   │  └─ api.js
   ├─ components/
   │  ├─ GymHeader.jsx
   │  ├─ HeaderBar.jsx
   │  ├─ PlanEditModal.jsx
   │  ├─ PlansTable.jsx
   │  └─ SlotsTable.jsx
   └─ pages/
      ├─ OverviewPage.jsx
      ├─ PlansPage.jsx
      ├─ SlotsPage.jsx
      └─ PayoutsPage.jsx
```
## Avvio
```bash
npm install
npm run dev
```
### Config .env (opzionale)
VITE_API_BASE=http://localhost:3000
## Backend atteso
- GET    /gyms/:id
- GET    /plans?gym_id=
- PATCH  /partner/plans/:id         (aggiungilo nel BE)
- GET    /partner/slots?gym_id=&date=  (aggiungilo nel BE)
- PATCH  /partner/slots/:id


## Nuove feature
- **Auth partner** (login con token, `Authorization: Bearer`)
- **Creazione/Eliminazione piani**
- **Pagina “Check-in oggi”** con ricerca utente

### Nuovi endpoint BE richiesti
- `POST   /auth/partner/login` → { token, partner }
- `POST   /partner/plans` → crea piano (body: gym_id, name, plan_type, price_cents, ...)
- `DELETE /partner/plans/:id` → elimina piano
- `GET    /partner/slots?gym_id=&date=` → lista slot del giorno
- `GET    /partner/checkins?gym_id=&date=&q=` → lista check-in del giorno (join con users/plans)
