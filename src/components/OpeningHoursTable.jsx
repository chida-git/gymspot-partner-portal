import { useEffect, useMemo, useRef, useState } from "react";

const DAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"];
const LABELS = { mon:"Lun", tue:"Mar", wed:"Mer", thu:"Gio", fri:"Ven", sat:"Sab", sun:"Dom" };
const timeRx = /^([01]\d|2[0-3]):[0-5]\d$/;

const emptyModel = () => DAY_KEYS.reduce((a,k)=> (a[k]=[], a), {});

// ---- helpers di normalizzazione / confronto ----
function normalize(v) {
  const base = emptyModel();
  if (!v || typeof v !== "object") return base;
  for (const d of DAY_KEYS) {
    const arr = Array.isArray(v[d]) ? v[d] : [];
    base[d] = arr.map(s => ({ open: s.open ?? "", close: s.close ?? "" }));
  }
  return base;
}
function toKey(h) {
  // chiave canonica per confronti rapidi
  return DAY_KEYS.map(d => (h[d]||[])
    .map(s => `${s.open}-${s.close}`).join("|")
  ).join(";");
}
function addMinutes(hhmm, minutes) {
  const [h,m] = hhmm.split(":").map(Number);
  const tot = (h*60 + m + minutes) % (24*60);
  const hh = String(Math.floor(tot/60)).padStart(2,"0");
  const mm = String(tot%60).padStart(2,"0");
  return `${hh}:${mm}`;
}
function normalizeTime(v) {
  if (!v) return v;
  if (/^\d{3,4}$/.test(v)) {
    const s = v.padStart(4,"0");
    return `${s.slice(0,2)}:${s.slice(2)}`;
  }
  return v;
}

export default function OpeningHoursTable({ value, onChange, maxSlotsPerDay = 6 }) {
  const [hours, setHours] = useState(() => normalize(value));
  const [errors, setErrors] = useState({});
  const lastSentKey = useRef("");   // evita onChange inutili

  // Aggiorna dallo prop SOLO se diverso (no rinormalizzazioni inutili)
  const normalizedProp = useMemo(() => normalize(value), [value]);
  useEffect(() => {
    if (toKey(normalizedProp) !== toKey(hours)) {
      setHours(normalizedProp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedProp]);

  // Valida + notifica il parent SOLO quando cambia davvero
  useEffect(() => {
    const errs = {};
    for (const day of DAY_KEYS) {
      const slots = (hours[day] || []).filter(s => timeRx.test(s.open||"") && timeRx.test(s.close||""))
                                     .sort((a,b) => a.open.localeCompare(b.open));
      // open < close
      if (slots.some(s => s.open >= s.close)) {
        errs[day] = "Orario non valido (apertura ≥ chiusura)";
        continue;
      }
      // sovrapposizioni
      for (let i=1;i<slots.length;i++) {
        if (slots[i-1].close > slots[i].open) {
          errs[day] = "Fasce sovrapposte";
          break;
        }
      }
    }
    setErrors(errs);

    const key = toKey(hours);
    if (key !== lastSentKey.current) {
      lastSentKey.current = key;
      onChange?.(hours, errs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  function addSlot(day) {
    setHours(h => {
      const arr = [...h[day]];
      if (arr.length >= maxSlotsPerDay) return h;
      const last = arr[arr.length - 1];
      const defOpen = last?.close || "09:00";
      const defClose = last ? addMinutes(last.close, 180) : "18:00";
      const next = { ...h, [day]: [...arr, { open: defOpen, close: defClose }] };
      return next;
    });
  }

  function removeSlot(day, idx) {
    setHours(h => {
      const arr = h[day].slice();
      arr.splice(idx, 1);
      return { ...h, [day]: arr };
    });
  }

  function setSlot(day, idx, field, val) {
    setHours(h => {
      const arr = h[day].map((s,i) => i===idx ? { ...s, [field]: normalizeTime(val) } : s);
      return { ...h, [day]: arr };
    });
  }

  function clearDay(day) { setHours(h => ({ ...h, [day]: [] })); }
  function copyDay(from, targets) {
    setHours(h => {
      const src = h[from].map(s => ({...s}));
      const next = { ...h };
      for (const t of targets) next[t] = src.map(s => ({...s}));
      return next;
    });
  }

  const hasAnyError = Object.keys(errors).length > 0;

  return (
    <div className="oh-table">
      <div className="oh-head">
        <h3>Orari di apertura</h3>
        {hasAnyError && <span className="oh-error-badge">Controlla gli orari evidenziati</span>}
      </div>

      <table className="oh">
        <thead>
          <tr>
            <th>Giorno</th>
            <th>Fasce orarie</th>
            <th scolSpan={3}>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {DAY_KEYS.map(day => (
            <tr key={day} className={errors[day] ? "invalid": ""}>
              <td className="day">{LABELS[day]}</td>
              <td className="slots">
                {hours[day].length === 0 && <em>Chiuso</em>}
                {hours[day].map((slot, idx) => (
                  <div className="slot-row" key={idx}>
                    <input type="time" value={slot.open || ""} onChange={e=>setSlot(day, idx, "open", e.target.value)} />
                    <span className="sep">–</span>
                    <input type="time" value={slot.close || ""} onChange={e=>setSlot(day, idx, "close", e.target.value)} />
                    <button type="button" className="btn-link danger" onClick={()=>removeSlot(day, idx)}>Rimuovi</button>
                  </div>
                ))}
                {errors[day] && <small className="err-msg">{errors[day]}</small>}
              </td>
              <td className="add">
                <button type="button" className="btn" onClick={()=>addSlot(day)} disabled={hours[day].length >= maxSlotsPerDay}>
                  + Aggiungi fascia
                </button>
              </td>
              <td className="copy">
                <button type="button" className="btn ghost" onClick={()=>clearDay(day)}>Imposta chiuso</button>
              </td>
              <td className="bulk">
                {day==="mon" ? (
                  <button type="button" className="btn ghost" onClick={()=>copyDay("mon", ["tue","wed","thu","fri"])}>Copia su feriali</button>
                ) : (
                  <button type="button" className="btn ghost" onClick={()=>copyDay(day, DAY_KEYS.filter(d=>d!==day))}>Copia su tutti</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <small className="oh-hint">Formato 24h. Più fasce per la pausa pranzo, ecc.</small>
    </div>
  );
}
