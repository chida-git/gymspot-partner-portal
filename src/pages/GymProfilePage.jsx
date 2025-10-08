import { useEffect, useState } from 'react';
import ProfileForm from '../components/ProfileForm';
import ImagesCarouselManager from '../components/ImagesCarouselManager';
import IndexImageEditor from '../components/IndexImageEditor';
import { getGymProfile, updateGymProfile } from '../services/api';
import { useAuth } from '../context/AuthContext'; // supponendo esista

export default function GymProfilePage() {
  const { user } = useAuth(); // assumo contenga gymId o simile
  // se non lo hai, ricava l'id da URL (useParams) o dal contesto
  const gymId = user?.gymId ?? 1;

  const [initial, setInitial] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getGymProfile(gymId);
      setInitial(data);
    } catch (e) {
      alert('Impossibile caricare il profilo');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [gymId]);

  async function handleSubmit(data) {
    setSaving(true);
    try {
      await updateGymProfile(gymId, data);
      await load();
    } catch (e) {
      alert(e.message || 'Errore salvataggio');
    } finally { setSaving(false); }
  }

  return (
    <div className="page">
      <h2>Profilo palestra</h2>
      {loading ? <p>Caricamento…</p> : (
        <>
          <ProfileForm initial={initial} onSubmit={handleSubmit} loading={saving} />
          <IndexImageEditor gymId={gymId} />
          <ImagesCarouselManager gymId={gymId} />
        </>
      )}
    </div>
  );
}
