'use client';
import { useState } from 'react';
import { GRADES, THRESHOLDS, fmt, gradeOf } from '@/lib/grading';

export default function LiveSlider() {
  const [v, setV] = useState(4);
  const g = gradeOf(v, THRESHOLDS.gula);
  return (
    <div className="live">
      <h3>Coba cepat: kadar gula</h3>
      <label htmlFor="sl">Gula per 100 ml: <output>{fmt(v)} g · grade {GRADES[g]}</output></label>
      <input id="sl" type="range" min={0} max={15} step={0.5} value={v} onChange={(e) => setV(Number(e.target.value))} />
      <div className="strip">
        {GRADES.map((x, i) => <span key={x} className={`g${x}${i === g ? ' on' : ''}`}>{x}</span>)}
      </div>
      <p className="hint" style={{ margin: 0 }}>Geser untuk melihat grade gula berubah. Penilaian lengkap juga menghitung garam, lemak jenuh, dan pemanis.</p>
    </div>
  );
}
