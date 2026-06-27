import { reciters } from '@/lib/surahNames';

export default function TopActions({ reciter, setReciter, onFontUp, onFontDown, focus, setFocus, onExport, onOpenMood, onOpenTasbeeh }) {
  return (
    <div className="top-actions">
      <button className="btn-warning icon-btn" onClick={onFontUp}>A+</button>
      <button className="btn-warning icon-btn" onClick={onFontDown}>A-</button>
      <button className="btn-accent" onClick={() => setFocus(!focus)}>🎯 {focus ? 'خروج التركيز' : 'وضع التركيز'}</button>
      <button className="btn-primary" onClick={onExport}>💾 تصدير البيانات</button>
      <button className="btn-secondary" onClick={onOpenMood}>🧠 حالتي اليوم</button>
      <button className="btn-secondary" onClick={onOpenTasbeeh}>📿 المسبحة الإلكترونية</button>
      <select value={reciter} onChange={(e) => setReciter(e.target.value)}>
        {reciters.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
    </div>
  );
}
