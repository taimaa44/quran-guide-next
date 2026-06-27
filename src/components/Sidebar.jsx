import { useEffect, useState } from 'react';
import { fetchSurah } from '@/lib/quran';
import { surahNames } from '@/lib/surahNames';

export default function Sidebar({ favorites, setFavorites }) {
  const [today, setToday] = useState(null);
  const [tasbeeh, setTasbeeh] = useState(0);
  const [target, setTarget] = useState(100);

  async function refreshToday() {
    const surah = Math.floor(Math.random() * 114) + 1;
    const ayahs = await fetchSurah(surah);
    const ayah = ayahs[Math.floor(Math.random() * ayahs.length)];
    setToday(ayah);
  }

  useEffect(() => { refreshToday(); }, []);

  function removeFav(index) {
    setFavorites(favorites.filter((_, i) => i !== index));
  }

  return (
    <aside className="col-side">
      <section className="card">
        <h2 className="section-title">آية اليوم</h2>
        <div className="today-ayah">
          {today ? <><div className="verse">{today.text}</div><div className="meta">{surahNames[today.surah]} — آية {today.number}</div></> : 'جاري التحميل...'}
        </div>
        <div className="action-row" style={{ marginTop: 12 }}>
          <button className="btn-secondary" onClick={refreshToday}>تحديث</button>
          <button className="btn-primary" onClick={() => today && setFavorites([today, ...favorites])}>⭐ حفظها</button>
        </div>
      </section>

      <section className="card" id="tasbeehSection">
        <h2 className="section-title">المسبحة الإلكترونية</h2>
        <div className="tasbeeh-box">
          <input type="number" min="10" value={target} onChange={(e) => setTarget(Number(e.target.value))} placeholder="الهدف" />
          <div className="tasbeeh-count">{tasbeeh}</div>
          <div className="meta" style={{ textAlign: 'center' }}>الهدف: {target}</div>
          <div className="tasbeeh-progress"><div className="tasbeeh-progress-fill" style={{ width: `${Math.min(100, (tasbeeh / target) * 100)}%` }} /></div>
          <div className="tasbeeh-tap-wrap"><button className="tasbeeh-tap-btn" onClick={() => setTasbeeh(tasbeeh + 1)}><div><div className="tasbeeh-tap-label">اضغط للتسبيح</div><div className="tasbeeh-tap-sub">كل ضغطة = +1</div></div></button></div>
          <button className="btn-danger" onClick={() => setTasbeeh(0)}>تصفير</button>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">المفضلة</h2>
        {favorites.length === 0 && <div className="empty">لا توجد آيات محفوظة.</div>}
        {favorites.map((f, i) => (
          <div className="favorite-item" key={`${f.surah}-${f.number}-${i}`}>
            <div>{f.text}</div>
            <div className="meta">{surahNames[f.surah]} — آية {f.number}</div>
            <button className="btn-danger" onClick={() => removeFav(i)}>حذف</button>
          </div>
        ))}
      </section>
    </aside>
  );
}
