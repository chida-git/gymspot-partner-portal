import { useEffect, useState } from 'react';
import OpeningHoursTable from './OpeningHoursTable';

export default function ProfileForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', web: '', description: ''
  });
  const [openingHours, setOpeningHours] = useState(null);
  const [ohErrors, setOhErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm(f => ({ ...f, ...initial }));
      setOpeningHours(initial.opening_hours || null);
    }
    // eslint-disable-next-line
  }, [initial]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (Object.keys(ohErrors).length > 0) {
      alert('Correggi gli orari evidenziati.');
      return;
    }
    onSubmit({ ...form, opening_hours: openingHours });
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="row">
        <label>Nome *</label>
        <input name="name" required maxLength={180} value={form.name || ''} onChange={handleChange} />
      </div>
      <div className="row">
        <label>Email</label>
        <input name="email" type="email" maxLength={180} value={form.email || ''} onChange={handleChange} />
      </div>
      <div className="row">
        <label>Telefono</label>
        <input name="phone" maxLength={40} value={form.phone || ''} onChange={handleChange} />
      </div>
      <div className="row">
        <label>Web</label>
        <input name="web" type="url" maxLength={2000} value={form.web || ''} onChange={handleChange} />
      </div>
      <div className="row">
        <label>Descrizione</label>
        <textarea name="description" rows={4} maxLength={500} value={form.description || ''} onChange={handleChange} />
      </div>

      {/* --- Opening Hours UI --- */}
      <OpeningHoursTable
        value={openingHours}
        onChange={(val, errs)=>{ setOpeningHours(val); setOhErrors(errs || {}); }}
      />

      <button disabled={loading} type="submit">{loading ? 'Salvataggio…' : 'Salva profilo'}</button>
    </form>
  );
}
