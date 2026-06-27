"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const surahs = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة",
  "يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم",
  "طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص",
  "العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات",
  "ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف",
  "محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن",
  "الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون",
  "التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن",
  "المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
  "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية",
  "الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر",
  "البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل",
  "قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"
];

const reciters = [
  { id: "ar.alafasy", name: "العفاسي" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط" },
  { id: "ar.abubakrshatri", name: "أبو بكر الشاطري" },
  { id: "ar.husary", name: "الحصري" },
  { id: "ar.minshawi", name: "المنشاوي" }
];

function normalizeArabic(text) {
  let cleaned = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ۖۗۘۙۚۛۜ۝۞]/g, "")
    .replace(/[ًٌٍَُِّْـٰ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // إصلاح مشكلة المايك عندما يرجع الحروف مفصولة بمسافات
  const parts = cleaned.split(" ").filter(Boolean);
  const mostlySingleLetters =
    parts.length > 8 && parts.filter((p) => p.length === 1).length / parts.length > 0.55;

  if (mostlySingleLetters) {
    cleaned = parts.join("");
  }

  return cleaned;
}

function removeBasmalaForSearch(text, surahNumber, ayahNumber) {
  if (Number(surahNumber) === 1 || Number(ayahNumber) !== 1) return text;
  const normalized = normalizeArabic(text);
  if (!normalized.startsWith("بسم الله الرحمن الرحيم")) return text;
  return String(text || "").split(/\s+/).slice(4).join(" ").trim();
}

function similarity(query, verseText) {
  const q = normalizeArabic(query);
  const v = normalizeArabic(verseText);
  if (!q || !v) return 0;
  if (q === v) return 1;
  if (v.includes(q)) return 0.98;

  const qWords = q.split(" ").filter(Boolean);
  const vWords = v.split(" ").filter(Boolean);
  let exact = 0;
  qWords.forEach((word) => {
    if (vWords.includes(word)) exact += 1;
  });

  const wordScore = qWords.length ? exact / qWords.length : 0;
  let sequenceScore = 0;

  for (let len = Math.min(qWords.length, 6); len >= 2; len--) {
    for (let i = 0; i <= qWords.length - len; i++) {
      const phrase = qWords.slice(i, i + len).join(" ");
      if (v.includes(phrase)) {
        sequenceScore = len / qWords.length;
        break;
      }
    }
    if (sequenceScore > 0) break;
  }

  return Math.min(wordScore * 0.45 + sequenceScore * 0.55, 0.97);
}

function compareRecitation(correctText, userText) {
  const originalWords = normalizeArabic(correctText).split(" ").filter(Boolean);
  const userWords = normalizeArabic(userText).split(" ").filter(Boolean);
  const used = new Array(userWords.length).fill(false);
  const good = [];
  const missing = [];
  const extra = [];

  originalWords.forEach((word) => {
    const foundIndex = userWords.findIndex((w, i) => !used[i] && w === word);
    if (foundIndex !== -1) {
      good.push(word);
      used[foundIndex] = true;
    } else {
      missing.push(word);
    }
  });

  userWords.forEach((word, i) => {
    if (!used[i]) extra.push(word);
  });

  const accuracy = originalWords.length
    ? Math.round((good.length / originalWords.length) * 100)
    : 0;

  return { accuracy, good, missing, extra };
}

export default function Home() {
  const [activePage, setActivePage] = useState("home");
  const [query, setQuery] = useState("");
  const [surah, setSurah] = useState(1);
  const [ayahs, setAyahs] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [today, setToday] = useState(null);
  const [font, setFont] = useState(28);
  const [focus, setFocus] = useState(false);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [tasbeeh, setTasbeeh] = useState(0);
  const [mistakes, setMistakes] = useState({});
  const [botOpen, setBotOpen] = useState(false);
  const [botText, setBotText] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "أهلاً بك، اسألني عن آية أو سورة أو تفسير." }
  ]);
  const [repeatIndex, setRepeatIndex] = useState(0);
  const [repeatGap, setRepeatGap] = useState(8);
  const [listening, setListening] = useState(false);

  const [micSurah, setMicSurah] = useState(1);
  const [micStartAyah, setMicStartAyah] = useState(1);
  const [micEndAyah, setMicEndAyah] = useState("");
  const [micAyahs, setMicAyahs] = useState([]);
  const [micIndex, setMicIndex] = useState(0);
  const [micText, setMicText] = useState("");
  const [micResult, setMicResult] = useState(null);
  const [micListening, setMicListening] = useState(false);
  const [micStatus, setMicStatus] = useState("اختر اسم السورة ثم اضغط ابدأ التسميع.");

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  const totalMistakes = useMemo(
    () => Object.values(mistakes).reduce((a, b) => a + b, 0),
    [mistakes]
  );

  const mostMistakeSurah = useMemo(() => {
    return Object.entries(mistakes).sort((a, b) => b[1] - a[1])[0];
  }, [mistakes]);

  const level = useMemo(() => {
    const score = favorites.length * 8 + tasbeeh / 3 + totalMistakes * 2;
    if (score > 250) return "متقدم";
    if (score > 80) return "متوسط";
    return "مبتدئ";
  }, [favorites.length, tasbeeh, totalMistakes]);

  const xpWidth = Math.min(100, favorites.length * 8 + tasbeeh / 3 + totalMistakes * 2);
  const currentMicAyah = micAyahs[micIndex];

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem("favorites") || "[]"));
    setTasbeeh(Number(localStorage.getItem("tasbeeh") || 0));
    setMistakes(JSON.parse(localStorage.getItem("mistakes") || "{}"));

    const savedReciter = localStorage.getItem("reciter") || "ar.alafasy";
    setReciter(savedReciter);

    loadToday();
    loadSurah(1, savedReciter);
  }, []);

  useEffect(() => {
    localStorage.setItem("tasbeeh", String(tasbeeh));
  }, [tasbeeh]);

  async function loadSurah(num, selectedReciter = reciter) {
    setSurah(num);
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/${selectedReciter}`);
    const data = await res.json();
    setAyahs(data.data.ayahs || []);
    setRepeatIndex(0);
  }

  async function searchQuran() {
    if (!query.trim()) return;

    setSearching(true);
    setResults([]);

    const ranked = [];
    const qNorm = normalizeArabic(query);

    try {
      for (let i = 1; i <= 114; i++) {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${i}/quran-uthmani`);
        const data = await res.json();
        const apiSurahName = data.data.name;
        const simpleSurahName = surahs[i - 1];

        data.data.ayahs.forEach((ayah) => {
          const cleanText = removeBasmalaForSearch(ayah.text, i, ayah.numberInSurah);
          const normalizedVerse = normalizeArabic(cleanText);
          const exactMatch = normalizedVerse.includes(qNorm);
          const nlpScore = similarity(query, cleanText);

          const surahNameMatch =
            normalizeArabic(simpleSurahName) === qNorm ||
            normalizeArabic(apiSurahName).replace(/^سوره\s+/, "") === qNorm;

          let finalScore = nlpScore;
          if (exactMatch) finalScore += 0.35;
          if (surahNameMatch) {
            if (exactMatch) finalScore += 1.2;
            if (ayah.numberInSurah === 1 && exactMatch) finalScore += 0.6;
          }

          if (finalScore > 0.15 || exactMatch || surahNameMatch) {
            ranked.push({
              ...ayah,
              text: cleanText || ayah.text,
              surahName: apiSurahName,
              surahNumber: i,
              finalScore,
            });
          }
        });
      }

      const exactResults = ranked.filter((item) => normalizeArabic(item.text).includes(qNorm));
      const sourceResults = exactResults.length ? exactResults : ranked;
      const finalResults = sourceResults
        .sort((a, b) => {
          if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
          if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
          return a.numberInSurah - b.numberInSurah;
        })
        .slice(0, 20);

      setResults(finalResults);
    } finally {
      setSearching(false);
    }
  }

  async function loadToday() {
    const n = Math.floor(Math.random() * 114) + 1;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`);
    const data = await res.json();
    const list = data.data.ayahs;
    const ayah = list[Math.floor(Math.random() * list.length)];
    setToday({ ...ayah, surahName: data.data.name, surahNumber: n });
  }

  function saveFavorite(item) {
    const next = [...favorites, item];
    setFavorites(next);
    localStorage.setItem("favorites", JSON.stringify(next));
  }

  function playAyah(ayah) {
    const src = ayah.audio || `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayah.number}.mp3`;
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.play();
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setListening(false);
  }

  function addMistake(customSurahName = surahs[surah - 1]) {
    const next = { ...mistakes, [customSurahName]: (mistakes[customSurahName] || 0) + 1 };
    setMistakes(next);
    localStorage.setItem("mistakes", JSON.stringify(next));
  }

  function clearMistakes() {
    setMistakes({});
    localStorage.removeItem("mistakes");
  }

  function voiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("المتصفح لا يدعم البحث الصوتي. استخدم Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar";
    recognition.start();
    recognition.onresult = (event) => setQuery(event.results[0][0].transcript);
  }

  async function sendBot() {
    if (!botText.trim()) return;

    const currentText = botText;
    setMessages((prev) => [...prev, { role: "user", text: currentText }]);
    setBotText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentText })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || "لم يصل رد." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "تعذر الاتصال بالشات بوت." }]);
    }
  }

  function moodAyah() {
    setBotOpen(true);
    setBotText("أنا أشعر اليوم بالقلق، اقترح لي آية مناسبة مع شرح قصير");
  }

  function startListenRepeat() {
    if (!ayahs.length) return;
    setListening(true);
    const ayah = ayahs[repeatIndex] || ayahs[0];
    playAyah(ayah);
    setTimeout(() => {
      setRepeatIndex((prev) => Math.min(prev + 1, ayahs.length - 1));
    }, repeatGap * 1000);
  }

  function nextRepeat() {
    setRepeatIndex((prev) => Math.min(prev + 1, ayahs.length - 1));
  }

  function jumpToAyah() {
    const input = document.getElementById("jumpAyah")?.value;
    const n = Number(input);
    if (!n || n < 1 || n > ayahs.length) return;
    document.getElementById(`ayah-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function startMicRecitationSession() {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${micSurah}/quran-uthmani`);
    const data = await res.json();
    const list = data.data.ayahs || [];
    const start = Math.max(1, Number(micStartAyah || 1));
    const end = micEndAyah ? Math.min(Number(micEndAyah), list.length) : list.length;
    const selected = list.filter((a) => a.numberInSurah >= start && a.numberInSurah <= end);

    setMicAyahs(selected);
    setMicIndex(0);
    setMicText("");
    setMicResult(null);
    setMicStatus(`السورة: ${surahs[micSurah - 1]} — الآية الحالية: ${start} / آخر آية بالمقطع: ${end}`);
  }

  function startMicListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("المتصفح لا يدعم المايك للتسميع. استخدم Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript + " ";
      }
      setMicText(finalText.trim());
    };

    recognition.onend = () => setMicListening(false);
    recognition.onerror = () => setMicListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setMicListening(true);
  }

  function stopMicListening() {
    if (recognitionRef.current) recognitionRef.current.stop();
    setMicListening(false);
  }

  function analyzeMicRecitation() {
    if (!currentMicAyah) return;
    if (!micText.trim()) {
      alert("افتح المايك واقرأ الآية أولًا.");
      return;
    }

    const result = compareRecitation(currentMicAyah.text, micText);
    setMicResult(result);

    if (result.accuracy < 90 || result.missing.length || result.extra.length) {
      addMistake(surahs[micSurah - 1]);
    }
  }

  function nextMicAyah() {
    setMicText("");
    setMicResult(null);
    setMicIndex((prev) => Math.min(prev + 1, micAyahs.length - 1));
  }

  function endMicSession() {
    stopMicListening();
    setMicAyahs([]);
    setMicIndex(0);
    setMicText("");
    setMicResult(null);
    setMicStatus("تم إنهاء جلسة التسميع.");
  }

  return (
    <main className={focus ? "focus-mode" : ""}>
      <div className="container">
        <header className="hero">
          <h1>المرشد القرآني الذكي</h1>
          <p>
            تطبيق متكامل للبحث الذكي في القرآن الكريم مع التفسير، المفضلة،
            التسميع، التذكير اليومي، وضع استمع وكرر، وتحليل أخطاء القراءة بالصوت.
          </p>
        </header>

        <div className="top-actions">
          <button onClick={() => setFont(font + 2)} className="btn-warning">+A</button>
          <button onClick={() => setFont(Math.max(18, font - 2))} className="btn-warning">-A</button>
          <button onClick={() => setFocus(!focus)} className="btn-accent">🎯 وضع التركيز</button>
          <button onClick={moodAyah} className="btn-secondary">🧠 حالتي اليوم</button>

          <button
            onClick={() => document.getElementById("mic-recitation")?.scrollIntoView({ behavior: "smooth" })}
            className="btn-primary"
          >
            🎙️ التسميع بالمايك
          </button>

          <button
            onClick={() => setActivePage(activePage === "tasbeeh" ? "home" : "tasbeeh")}
            className="btn-secondary"
          >
            📿 المسبحة الإلكترونية
          </button>

          <button
            onClick={() => setActivePage(activePage === "dashboard" ? "home" : "dashboard")}
            className="btn-primary"
          >
            📊 لوحة الإنجاز
          </button>

          <select
            value={reciter}
            onChange={(e) => {
              setReciter(e.target.value);
              localStorage.setItem("reciter", e.target.value);
              loadSurah(surah, e.target.value);
            }}
          >
            {reciters.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {activePage === "dashboard" && (
          <section className="page-panel">
            <div className="card dashboard-full">
              <h2>📊 لوحة الإنجاز الذكية</h2>
              <div className="level-box">
                <div className="level-top"><span>🏆 المستوى الحالي</span><strong>{level}</strong></div>
                <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpWidth}%` }} /></div>
              </div>
              <div className="stats dashboard-grid">
                <div><b>{favorites.length}</b><span>⭐ آيات محفوظة</span></div>
                <div><b>{tasbeeh}</b><span>📿 تسبيحات</span></div>
                <div><b>{totalMistakes}</b><span>❌ أخطاء التسميع</span></div>
                <div><b>{Object.keys(mistakes).length}</b><span>📚 سور تدربت عليها</span></div>
                <div><b>{reciters.find((r) => r.id === reciter)?.name}</b><span>🎙️ المقرئ الحالي</span></div>
                <div><b>{Math.max(1, Math.floor((favorites.length + tasbeeh) / 25))}</b><span>🔥 سلسلة الإنجاز</span></div>
              </div>
              <div className="dashboard-section">
                <h3>أكثر السور أخطاء</h3>
                {Object.entries(mistakes).length === 0 ? <p>لا توجد أخطاء مسجلة بعد.</p> :
                  Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => (
                    <div className="mistake-row" key={name}><span>{name}</span><strong>{count}</strong></div>
                  ))
                }
              </div>
              <button onClick={() => setActivePage("home")} className="btn-secondary">رجوع للرئيسية</button>
            </div>
          </section>
        )}

        {activePage === "tasbeeh" && (
          <section className="page-panel">
            <div className="card tasbeeh-page">
              <h2>📿 المسبحة الإلكترونية</h2>
              <div className="counter huge-counter">{tasbeeh}</div>
              <button onClick={() => setTasbeeh(tasbeeh + 1)} className="circle huge-circle">سبحان الله</button>
              <button onClick={() => setTasbeeh(0)} className="btn-danger">تصفير</button>
              <button onClick={() => setActivePage("home")} className="btn-secondary">رجوع للرئيسية</button>
            </div>
          </section>
        )}

        {activePage === "home" && (
          <div className="grid">
            <section className="main">
              <div className="card">
                <h2>البحث الذكي</h2>
                <div className="row">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchQuran()} placeholder="اكتب جزءًا من الآية أو معنى تريد البحث عنه..." />
                  <button onClick={searchQuran} className="btn-primary">{searching ? "جاري البحث..." : "بحث"}</button>
                  <button onClick={voiceSearch} className="btn-secondary">🎤 بحث صوتي</button>
                </div>
                {results.length === 0 && query.trim() && !searching && <p className="muted">لا توجد نتائج بعد. اضغط بحث أو جرّب كلمات أقل.</p>}
                {results.map((r, i) => (
                  <div className="result" key={i}>
                    <div className="verse" style={{ fontSize: font }}>{r.text}</div>
                    <p>{r.surahName} — آية {r.numberInSurah}</p>
                    <button onClick={() => saveFavorite(r)} className="btn-primary">⭐ حفظ</button>
                    <button onClick={() => playAyah(r)} className="btn-secondary">▶ استماع</button>
                  </div>
                ))}
              </div>

              <div className="card">
                <h2>عرض السورة</h2>
                <div className="row">
                  <select value={surah} onChange={(e) => loadSurah(Number(e.target.value))}>
                    {surahs.map((s, i) => <option key={s} value={i + 1}>{i + 1} - {s}</option>)}
                  </select>
                  <input id="jumpAyah" type="number" min="1" placeholder="اذهب لرقم آية" />
                  <button onClick={jumpToAyah} className="btn-secondary">↗ انتقال</button>
                  <button onClick={() => ayahs[0] && playAyah(ayahs[0])} className="btn-accent">📖 تشغيل أول آية</button>
                  <button onClick={stopAudio} className="btn-danger">■ إيقاف</button>
                </div>
                {ayahs.map((a) => (
                  <div className="ayah" id={`ayah-${a.numberInSurah}`} key={a.number}>
                    <div className="verse" style={{ fontSize: font }}>{a.text}</div>
                    <p>آية {a.numberInSurah}</p>
                    <button onClick={() => playAyah(a)} className="btn-secondary">▶ استماع</button>
                    <button onClick={() => saveFavorite({ ...a, surahName: surahs[surah - 1], surahNumber: surah })} className="btn-primary">⭐ حفظ</button>
                  </div>
                ))}
              </div>

              <div className="card" id="mic-recitation">
                <h2>وضع التسميع بالمايك مع كشف الأخطاء</h2>
                <p className="muted">اختر اسم السورة، ثم ابدأ التسميع، افتح المايك واقرأ الآية بصوتك، وسيحوّل التطبيق صوتك إلى نص ويكشف الأخطاء.</p>
                <div className="row">
                  <select value={micSurah} onChange={(e) => setMicSurah(Number(e.target.value))}>
                    {surahs.map((s, i) => <option key={s} value={i + 1}>{i + 1} - {s}</option>)}
                  </select>
                  <input type="number" min="1" value={micStartAyah} onChange={(e) => setMicStartAyah(e.target.value)} placeholder="من آية" />
                  <input type="number" min="1" value={micEndAyah} onChange={(e) => setMicEndAyah(e.target.value)} placeholder="إلى آية / اتركها للنهاية" />
                  <button onClick={startMicRecitationSession} className="btn-primary">ابدأ التسميع</button>
                </div>

                <div className="mic-status">{micStatus}</div>

                {currentMicAyah && (
                  <div className="result">
                    <p className="muted">السورة: {surahs[micSurah - 1]} — الآية الحالية: {currentMicAyah.numberInSurah} / {micAyahs[micAyahs.length - 1]?.numberInSurah}</p>
                    <div className="row">
                      <button onClick={startMicListening} className="btn-primary" disabled={micListening}>🎙️ ابدأ المايك</button>
                      <button onClick={stopMicListening} className="btn-danger">■ إيقاف المايك</button>
                      <button onClick={analyzeMicRecitation} className="btn-secondary">تحليل التسميع</button>
                      <button onClick={nextMicAyah} className="btn-primary">التالي</button>
                      <button onClick={endMicSession} className="btn-danger">إنهاء</button>
                    </div>
                    <textarea className="recitation-input" value={micText} onChange={(e) => setMicText(e.target.value)} placeholder="سيظهر هنا كلامك بعد تشغيل المايك... ويمكنك تعديله يدويًا قبل التحليل." />
                    {micListening && <p className="mic-status">🎙️ المايك يعمل الآن... اقرأ الآية بصوت واضح.</p>}

                    {micResult && (
                      <div className="recitation-result">
                        <div className="accuracy-box">الدقة: {micResult.accuracy}%</div>
                        <p><b>الكلمات الصحيحة:</b></p>
                        <div className="token-wrap">{micResult.good.map((w, i) => <span className="token good" key={i}>{w}</span>)}</div>
                        <p><b>الكلمات الناقصة:</b></p>
                        <div className="token-wrap">{micResult.missing.length ? micResult.missing.map((w, i) => <span className="token missing" key={i}>{w}</span>) : <span>لا يوجد</span>}</div>
                        <p><b>الكلمات الزائدة:</b></p>
                        <div className="token-wrap">{micResult.extra.length ? micResult.extra.map((w, i) => <span className="token extra" key={i}>{w}</span>) : <span>لا يوجد</span>}</div>
                        <details className="answer-box">
                          <summary>إظهار الآية الصحيحة</summary>
                          <div className="verse" style={{ fontSize: font }}>{currentMicAyah.text}</div>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card">
                <h2>وضع استمع وكرر</h2>
                <p className="muted">يشغل الآية، ثم يعطيك مهلة للترديد، وبعدها تنتقل للآية التالية.</p>
                <div className="row">
                  <input type="number" min="3" max="30" value={repeatGap} onChange={(e) => setRepeatGap(Number(e.target.value))} />
                  <button onClick={startListenRepeat} className="btn-primary">ابدأ</button>
                  <button onClick={() => ayahs[repeatIndex] && playAyah(ayahs[repeatIndex])} className="btn-secondary">إعادة الآية</button>
                  <button onClick={nextRepeat} className="btn-secondary">التالي</button>
                  <button onClick={stopAudio} className="btn-danger">إيقاف</button>
                </div>
                <div className="repeat-box">الآية الحالية: {ayahs[repeatIndex]?.numberInSurah || 1} / {ayahs.length || 0}{listening && <strong> — وضع التكرار يعمل</strong>}</div>
              </div>
            </section>

            <aside>
              <div className="card">
                <h2>آية اليوم</h2>
                {today && (
                  <>
                    <div className="today">{today.text}</div>
                    <p>{today.surahName} — آية {today.numberInSurah}</p>
                    <button onClick={() => saveFavorite(today)} className="btn-primary">⭐ حفظها</button>
                    <button onClick={loadToday} className="btn-secondary">تحديث</button>
                  </>
                )}
              </div>

              <div className="card">
                <h2>التذكير اليومي</h2>
                <div className="reminder">
                  <input type="time" defaultValue="08:00" />
                  <button onClick={() => alert("تم حفظ التذكير داخل الصفحة")} className="btn-primary">حفظ التذكير</button>
                  <button onClick={() => alert("تذكير: لا تنس وردك اليومي")} className="btn-secondary">اختبار الآن</button>
                </div>
              </div>

              <div className="card">
                <h2>لوحة أخطاء التسميع</h2>
                {mostMistakeSurah ? <div className="dashboard-box">أكثر سورة أخطأت فيها:<br />{mostMistakeSurah[0]} — {mostMistakeSurah[1]} أخطاء</div> : <p>لا توجد أخطاء مسجلة بعد.</p>}
                <button onClick={clearMistakes} className="btn-danger">تصفير الأخطاء</button>
              </div>

              <div className="card">
                <h2>المفضلة</h2>
                {favorites.length === 0 && <p>لا يوجد آيات محفوظة.</p>}
                {favorites.map((f, i) => <div className="fav" key={i}>{f.text}</div>)}
              </div>
            </aside>
          </div>
        )}
      </div>

      <button className="bot-toggle" onClick={() => setBotOpen(!botOpen)}>
        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="bot" />
      </button>

      {botOpen && (
        <div className="bot">
          <div className="bot-head">البوت الذكي <button onClick={() => setBotOpen(false)}>×</button></div>
          <div className="bot-body">{messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}</div>
          <div className="bot-input">
            <input value={botText} onChange={(e) => setBotText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendBot()} placeholder="اسأل..." />
            <button onClick={sendBot}>إرسال</button>
          </div>
        </div>
      )}
    </main>
  );
}
