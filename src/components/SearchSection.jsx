import { useState } from 'react';
import { fetchTafsir, searchQuran, audioUrl } from '@/lib/quran';
import { surahNames } from '@/lib/surahNames';

export default function SearchSection({ reciter, onSaveFavorite }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [audio, setAudio] = useState('');
  const [tafsir, setTafsir] = useState('اختر آية لعرض التفسير هنا.');

  async function doSearch() {
    if (!query.trim()) return setStatus('اكتب كلمة أو جزء من آية أولًا.');
    setStatus('جاري البحث...');
    setResults([]);
    const found = await searchQuran(query);
    setResults(found);
    setStatus(found.length ? `تم العثور على ${found.length} نتيجة.` : 'لم أجد نتائج. جرّب كلمة أخرى.');
  }

  async function playAyah(ayah) {
    setAudio(audioUrl(reciter, ayah.surah, ayah.number));
  }

  async function showTafsir(ayah) {
    setTafsir('جاري تحميل التفسير...');
    const text = await fetchTafsir(ayah.surah, ayah.number);
    setTafsir(text || 'لم أتمكن من تحميل التفسير الآن.');
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setStatus('المتصفح لا يدعم البحث الصوتي. جرّب Chrome.');
    const rec = new SR();
    rec.lang = 'ar';
    rec.onresult = (e) => setQuery(e.results[0][0].transcript);
    rec.start();
  }

  return (
    <section className="card" id="searchSection">
      <h2 className="section-title">البحث الذكي</h2>
      <div className="search-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} placeholder="اكتب جملة أو جزءًا من الآية أو معنى تريد البحث عنه" />
        <button className="btn-primary" onClick={doSearch}>بحث</button>
        <button className="btn-secondary" onClick={startVoice}>🎤 بحث صوتي</button>
      </div>
      <div className="status">{status}</div>
      <div>
        {results.map((ayah, i) => (
          <div className={`result ${i === 0 ? 'top' : ''}`} key={`${ayah.surah}-${ayah.number}`}>
            <span className="result-tag">{surahNames[ayah.surah]} — آية {ayah.number}</span>
            <div className="verse">{ayah.text}</div>
            <div className="action-row">
              <button className="btn-secondary" onClick={() => playAyah(ayah)}>▶ استماع</button>
              <button className="btn-primary" onClick={() => showTafsir(ayah)}>📚 تفسير</button>
              <button className="btn-warning" onClick={() => onSaveFavorite(ayah)}>⭐ مفضلة</button>
            </div>
          </div>
        ))}
      </div>
      {audio && <audio src={audio} controls autoPlay />}
      <div className="note-box"><h3 className="panel-title">التفسير</h3><p>{tafsir}</p></div>
    </section>
  );
}
