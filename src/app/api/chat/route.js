export const runtime = "nodejs";

const SURAH_NAMES = [
  "",
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

const ORDINALS = {
  الاولى: 1, الاول: 1, اول: 1,
  الثانية: 2, الثاني: 2, ثاني: 2,
  الثالثة: 3, الثالث: 3, ثالث: 3,
  الرابعة: 4, الرابع: 4, رابع: 4,
  الخامسة: 5, الخامس: 5, خامس: 5,
  السادسة: 6, السادس: 6, سادس: 6,
  السابعة: 7, السابع: 7, سابع: 7,
  الثامنة: 8, الثامن: 8, ثامن: 8,
  التاسعة: 9, التاسع: 9, تاسع: 9,
  العاشرة: 10, العاشر: 10, عاشر: 10
};

function normalizeArabic(text) {
  return String(text || "")
    .replace(/[ًٌٍَُِّْـٰ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0600-\u06FF\s0-9:\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function directAnswer(message) {
  const q = normalizeArabic(message);

  if (q.includes("عدد سور القران") || q.includes("كم سورة")) {
    return "عدد سور القرآن الكريم 114 سورة.";
  }

  if (q.includes("عدد ايات القران") || q.includes("كم عدد ايات القران") || q.includes("كم ايات القران")) {
    return "عدد آيات القرآن الكريم في العدّ المشهور 6,236 آية.";
  }

  if (q.includes("اطول سورة")) return "أطول سورة في القرآن الكريم هي سورة البقرة.";
  if (q.includes("اقصر سورة")) return "أقصر سورة في القرآن الكريم هي سورة الكوثر.";
  if (q.includes("اول سورة")) return "أول سورة في ترتيب المصحف هي سورة الفاتحة.";
  if (q.includes("اخر سورة")) return "آخر سورة في ترتيب المصحف هي سورة الناس.";

  return null;
}

function resolveSurahNumber(message) {
  const q = normalizeArabic(message);

  for (let i = 1; i < SURAH_NAMES.length; i++) {
    if (q.includes(normalizeArabic(SURAH_NAMES[i]))) return i;
  }

  return null;
}

function extractAyahNumber(message) {
  const q = normalizeArabic(message);

  const numberMatch = q.match(/(?:اية|ايه|الاية|الايه)\s*(\d{1,3})/);
  if (numberMatch) return Number(numberMatch[1]);

  const words = q.split(" ");
  for (const word of words) {
    if (ORDINALS[word]) return ORDINALS[word];
  }

  return null;
}

function parseReference(message) {
  const q = normalizeArabic(message);

  const pair = q.match(/(\d{1,3})\s*[:/]\s*(\d{1,3})/);
  if (pair) {
    return {
      surahNumber: Number(pair[1]),
      ayahNumber: Number(pair[2])
    };
  }

  const surahNumber = resolveSurahNumber(q);
  const ayahNumber = extractAyahNumber(q);

  if (surahNumber && ayahNumber) {
    return { surahNumber, ayahNumber };
  }

  return null;
}

function extractMeaningWord(message) {
  const q = normalizeArabic(message);

  const patterns = [
    /ما معنى كلمة\s+([ء-ي]+)/,
    /معنى كلمة\s+([ء-ي]+)/,
    /ما معنى\s+([ء-ي]+)/,
    /معنى\s+([ء-ي]+)/,
    /ما المقصود ب\s*([ء-ي]+)/,
    /ما المقصود\s+([ء-ي]+)/
  ];

  for (const p of patterns) {
    const m = q.match(p);
    if (m?.[1]) return m[1];
  }

  return null;
}

function getIntent(message) {
  const q = normalizeArabic(message);

  if (extractMeaningWord(q)) return "word_meaning";
  if (q.includes("فسر") || q.includes("تفسير") || q.includes("اشرح")) return "tafsir";
  if (q.includes("ايه عن") || q.includes("اية عن") || q.includes("ايات عن")) return "topic_verses";

  return "smart_search";
}

function scoreVerse(verseText, query) {
  const verse = normalizeArabic(verseText);
  const q = normalizeArabic(query);

  if (!verse || !q) return 0;
  if (verse.includes(q)) return 1000;

  const cleaned = q
    .replace(/ما معنى/g, "")
    .replace(/معنى/g, "")
    .replace(/كلمة/g, "")
    .replace(/فسر/g, "")
    .replace(/تفسير/g, "")
    .replace(/اشرح/g, "")
    .replace(/ايه عن/g, "")
    .replace(/اية عن/g, "")
    .replace(/ايات عن/g, "")
    .trim();

  const words = cleaned.split(" ").filter((w) => w.length > 1);

  let score = 0;

  for (const word of words) {
    if (verse.includes(word)) score += 60;
  }

  return score;
}

async function getVerse(surahNumber, ayahNumber) {
  const res = await fetch(
    `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`,
    { cache: "no-store" }
  );

  const data = await res.json();

  if (!data?.data?.text) return null;

  return {
    text: data.data.text,
    surahName: data.data.surah.name,
    surahNumber,
    ayahNumber
  };
}

async function searchBestVerse(message) {
  const word = extractMeaningWord(message);
  const query = word || message;
  const ranked = [];

  for (let surah = 1; surah <= 114; surah++) {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`,
      { cache: "no-store" }
    );

    const data = await res.json();

    for (const ayah of data.data?.ayahs || []) {
      const score = scoreVerse(ayah.text, query);

      if (score > 0) {
        ranked.push({
          score,
          text: ayah.text,
          surahName: data.data.name,
          surahNumber: surah,
          ayahNumber: ayah.numberInSurah
        });
      }
    }
  }

  return ranked.sort((a, b) => b.score - a.score)[0] || null;
}

function extractIbnKathir(html) {
  let text = stripHtml(html);

  const markers = [
    "عرض تفسير آخر",
    "View another tafsir",
    "آيــــات",
    "Holy Quran",
    "Project parts",
    "الانتقال للواجهة الرئيسية"
  ];

  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) text = text.slice(0, idx);
  }

  return text.replace(/\s+/g, " ").trim().slice(0, 3500);
}

async function fetchIbnKathir(surahNumber, ayahNumber) {
  const url = `https://quran.ksu.edu.sa/tafseer/katheer/sura${surahNumber}-aya${ayahNumber}.html`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 QuranGuide"
    },
    cache: "no-store"
  });

  if (!res.ok) return null;

  const html = await res.text();
  const text = extractIbnKathir(html);

  if (!text || text.length < 40) return null;

  return { url, text };
}

function simpleSourceAnswer(message, intent, verse, tafsir) {
  const word = extractMeaningWord(message);

  if (intent === "word_meaning" && word) {
    const normWord = normalizeArabic(word);
    const sentences = tafsir.text
      .split(/[.!؟،]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const best =
      sentences.find((s) => normalizeArabic(s).includes(normWord)) ||
      sentences.slice(0, 2).join("، ");

    return (
      `معنى "${word}" بحسب السياق وتفسير ابن كثير:\n\n` +
      `${best}\n\n` +
      `الآية المرتبطة:\n${verse.text}\n\n` +
      `المصدر: تفسير ابن كثير، ${verse.surahName}، آية ${verse.ayahNumber}.`
    );
  }

  return (
    `تفسير ابن كثير للآية:\n\n` +
    `${tafsir.text.slice(0, 1000)}\n\n` +
    `الآية:\n${verse.text}\n\n` +
    `المصدر: تفسير ابن كثير، ${verse.surahName}، آية ${verse.ayahNumber}.`
  );
}

async function askGroq(message, intent, verse, tafsir) {
  if (!process.env.GROQ_API_KEY) {
    return simpleSourceAnswer(message, intent, verse, tafsir);
  }

  const systemPrompt = `
أنت مساعد قرآني موثوق مثل Google AI Overview.
المصدر الوحيد المسموح هو الآية وتفسير ابن كثير المرفقان.
ممنوع اختراع آيات أو أحاديث أو معلومات من الذاكرة.
إذا لم تجد الجواب في المصدر، قل: لا أستطيع الجزم من تفسير ابن كثير المتاح.
إذا كان السؤال عن معنى كلمة، فاشرح الكلمة من سياق الآية ومن تفسير ابن كثير فقط.
إذا كان السؤال تفسير آية، لخّص تفسير ابن كثير.
اذكر المصدر في آخر الجواب.
لا تعط فتوى شرعية.
اكتب جوابًا عربيًا واضحًا ومنظمًا.
`;

  const userPrompt = `
نوع السؤال: ${intent}

سؤال المستخدم:
${message}

الآية:
${verse.text}

الموضع:
${verse.surahName}، رقم السورة ${verse.surahNumber}، آية ${verse.ayahNumber}

تفسير ابن كثير:
${tafsir.text}

رابط المصدر:
${tafsir.url}

اكتب الجواب من المصدر فقط.
`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  const data = await groqRes.json();

  return (
    data.choices?.[0]?.message?.content ||
    simpleSourceAnswer(message, intent, verse, tafsir)
  );
}

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return Response.json({ reply: "اكتب سؤالك أولًا." });
    }

    const quick = directAnswer(message);
    if (quick) {
      return Response.json({ reply: quick });
    }

    const intent = getIntent(message);
    const ref = parseReference(message);

    let verse = null;

    if (ref?.surahNumber && ref?.ayahNumber) {
      verse = await getVerse(ref.surahNumber, ref.ayahNumber);
    }

    if (!verse) {
      verse = await searchBestVerse(message);
    }

    if (!verse) {
      return Response.json({
        reply:
          "لم أجد آية مناسبة من المصدر. جرّب كتابة كلمة من الآية أو اكتب مثلًا: فسر سورة الفاتحة آية 1."
      });
    }

    const tafsir = await fetchIbnKathir(verse.surahNumber, verse.ayahNumber);

    if (!tafsir) {
      return Response.json({
        reply:
          `وجدت الآية:\n\n${verse.text}\n\n` +
          `الموضع: ${verse.surahName}، آية ${verse.ayahNumber}\n\n` +
          `لكن لم أستطع جلب تفسير ابن كثير الآن.`
      });
    }

    const reply = await askGroq(message, intent, verse, tafsir);

    return Response.json({ reply });
  } catch {
    return Response.json({
      reply: "حدث خطأ أثناء جلب المصدر. جرّب مرة أخرى."
    });
  }
}