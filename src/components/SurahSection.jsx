import { useState } from 'react';
import { fetchSurah, audioUrl } from '@/lib/quran';
import { surahNames } from '@/lib/surahNames';

export default function SurahSection({ reciter, onSaveFavorite, focus, setFocus }) {
  const [surah, setSurah] = useState(1);
  const [ayahJump, setAyahJump] = useState('');
  const [ayahs, setAyahs] = useState([]);
  const [status, setStatus] = useState('');
  const [audio, setAudio] = useState('');

  async function loadSurah(target = surah) {
    setStatus('جاري تحميل السورة...');
    const data = await fetchSurah(Number(target));
    setAyahs(data);
    setStatus(`تم عرض سورة ${surahNames[target]}.`);
    setTimeout(() => {
      if (ayahJump) document.getElementById(`ayah-${target}-${ayahJump}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  function playFull() {
    if (!ayahs.length) return setStatus('اعرض السورة أولًا.');
    setAudio(audioUrl(reciter, Number(surah), 1));
    setStatus('تم تشغيل أول آية. للتطوير: يمكن إضافة قائمة تشغيل كاملة لاحقًا.');
  }

  return (
    <section className="card" id="surahSection">
      {focus && <div className="focus-bar"><button className="btn-accent" onClick={() => setFocus(false)}>⬅ الخروج من وضع التركيز</button></div>}
      <h2 className="section-title">عرض السورة</h2>
      <div className="toolbar">
        <select value={surah} onChange={(e) => setSurah(Number(e.target.value))}>
          {surahNames.slice(1).map((name, i) => <option value={i + 1} key={name}>{i + 1} - {name}</option>)}
        </select>
        <input type="number" min="1" value={ayahJump} onChange={(e) => setAyahJump(e.target.value)} placeholder="اذهب لرقم آية" />
        <button className="btn-gray" onClick={() => document.getElementById(`ayah-${surah}-${ayahJump}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>⤴ انتقال</button>
        <button className="btn-accent" onClick={() => loadSurah()}>📖 عرض السورة</button>
        <button className="btn-secondary" onClick={playFull}>▶ تشغيل السورة</button>
      </div>
      <div className="status muted">{status}</div>
      {audio && <audio src={audio} controls autoPlay />}
      <div>
        {ayahs.map((ayah) => (
          <div className="result" id={`ayah-${ayah.surah}-${ayah.number}`} key={ayah.number}>
            <div className="verse">{ayah.text}</div>
            <div className="meta">{surahNames[ayah.surah]} — آية {ayah.number}</div>
            <div className="action-row">
              <button className="btn-secondary" onClick={() => setAudio(audioUrl(reciter, ayah.surah, ayah.number))}>▶ استماع</button>
              <button className="btn-warning" onClick={() => onSaveFavorite(ayah)}>⭐ حفظ</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
