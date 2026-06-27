import { useState } from 'react';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', content: 'أهلاً بك. اسألني عن طريقة استخدام التطبيق أو اطلب آية مناسبة لحالتك.' }]);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    const current = input;
    setInput('');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: current }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: 'bot', content: data.reply }]);
  }

  return (
    <>
      <button className="bot-toggle" onClick={() => setOpen(!open)} aria-label="فتح البوت">🤖</button>
      <section className={`bot-panel ${open ? 'open' : ''}`}>
        <div className="bot-head"><strong>البوت الذكي</strong><button className="btn-danger" onClick={() => setOpen(false)}>إغلاق</button></div>
        <div className="bot-messages">
          {messages.map((m, i) => <div key={i} className={`bot-msg ${m.role}`}>{m.content}</div>)}
        </div>
        <div className="bot-input-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="اسأل أي سؤال..." />
          <button className="btn-primary" onClick={send}>إرسال</button>
        </div>
      </section>
    </>
  );
}
