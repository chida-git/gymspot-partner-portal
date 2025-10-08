import { useEffect, useState } from 'react';
import { listPresentationImages, uploadPresentationImages, deletePresentationImage } from '../services/api';

export default function ImagesCarouselManager({ gymId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextToken, setNextToken] = useState(null);
  const limit = 10;

  async function load() {
    setLoading(true);
    try {
      const data = await listPresentationImages(gymId, { limit });
      setItems(data.items || []);
      setNextToken(data.nextToken || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [gymId]);

  async function onUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setLoading(true);
    try {
      await uploadPresentationImages(gymId, files);
      await load();
      e.target.value = ''; // reset
    } catch (err) {
      alert(err.message || 'Errore upload');
    } finally { setLoading(false); }
  }

  async function onDelete(filename) {
    if (!confirm(`Eliminare ${filename}?`)) return;
    setLoading(true);
    try {
      await deletePresentationImage(gymId, filename);
      await load();
    } catch (err) {
      alert(err.message || 'Errore eliminazione');
    } finally { setLoading(false); }
  }

  return (
    <section className="images-manager">
      <header className="flex">
        <h3>Carosello immagini (max 10)</h3>
        <label className="upload-btn">
          {loading ? '…' : 'Aggiungi immagini'}
          <input type="file" accept="image/*" multiple onChange={onUpload} hidden />
        </label>
      </header>

      {loading && <p>Caricamento…</p>}

      <div className="thumb-grid">
        {items.map(img => (
          <figure key={img.key} className="thumb">
            <img src={img.url} alt={img.filename} />
            <figcaption>
              <span>{img.filename}</span>
              <button onClick={() => onDelete(img.filename)}>Elimina</button>
            </figcaption>
          </figure>
        ))}
        {items.length === 0 && !loading && <p>Nessuna immagine presente.</p>}
      </div>

      {nextToken && <small>Altre immagini presenti, ma il limite UI è 10.</small>}
    </section>
  );
}
