export async function POST(req) {
  try {
    const { message } = await req.json();

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد قرآني عربي محترم. أجب بالعربية فقط. لا تُصدر فتاوى قطعية، واذكر أن التفسير يحتاج الرجوع لأهل العلم عند المسائل الشرعية.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { reply: "حدث خطأ من Groq API. تأكد من المفتاح والموديل." },
        { status: 500 }
      );
    }

    return Response.json({
      reply: data.choices?.[0]?.message?.content || "لم يصل رد من البوت.",
    });
  } catch (error) {
    return Response.json(
      { reply: "حدث خطأ في السيرفر." },
      { status: 500 }
    );
  }
}