import { useMemo, useRef, useState } from 'react';
import { getIndexImageUrl, putIndexImage } from '../services/api';

export default function IndexImageEditor({ gymId }) {
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const inputRef = useRef(null);

  const src = useMemo(() => `${getIndexImageUrl(gymId)}&v=${tick}`, [gymId, tick]);

  async function changeFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      await putIndexImage(gymId, f);
      setTick(t => t + 1); // bust cache to refresh preview
    } catch (err) {
      alert(err.message || 'Errore caricamento index');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className="index-editor">
      <h3>Foto index (500x500 + marker 100x100)</h3>
      <div className="index-row">
        <img className="index-preview" src={src} alt="Index" onError={(e)=>{e.currentTarget.style.opacity=0.3}} />
        <label className="upload-btn">
          {busy ? 'Aggiorno…' : 'Sostituisci foto'}
          <input ref={inputRef} type="file" accept="image/*" onChange={changeFile} hidden />
        </label>
      </div>
    </section>
  );
}
