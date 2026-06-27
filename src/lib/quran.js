export function normalizeArabic(text = '') {
  return String(text)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْٰـ]/g, '')
    .replace(/[^00-FF0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function audioUrl(reciter, surahNumber, ayahNumber) {
  const n = String(surahNumber).padStart(3, '0') + String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${n}.mp3`;
}

export async function fetchSurah(surahNumber) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`, { cache: 'no-store' });
  if (!res.ok) throw new Error('تعذر تحميل السورة');
  const json = await res.json();
  return json.data.ayahs.map((a) => ({
    number: a.numberInSurah,
    text: a.text,
    surah: surahNumber,
  }));
}

export async function fetchTafsir(surahNumber, ayahNumber) {
  const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.muyassar`, { cache: 'no-store' });
  if (!res.ok) return '';
  const json = await res.json();
  return json?.data?.text || '';
}

export async function searchQuran(query) {
  const clean = normalizeArabic(query);
  if (!clean) return [];
  const words = clean.split(' ').filter(Boolean);
  const promises = Array.from({ length: 114 }, (_, i) => fetchSurah(i + 1).catch(() => []));
  const allSurahs = await Promise.all(promises);
  const all = allSurahs.flat();
  return all
    .map((ayah) => {
      const normalizedText = normalizeArabic(ayah.text);
      const score = words.reduce((sum, w) => sum + (normalizedText.includes(w) ? 1 : 0), 0);
      return { ...ayah, score };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

export function randomAyahRef() {
  return {
    surah: Math.floor(Math.random() * 114) + 1,
    ayah: 1,
  };
}
