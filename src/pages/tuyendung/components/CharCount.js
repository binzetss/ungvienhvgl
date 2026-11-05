function CharCount({ value, max }) {
  const len = (value || '').length;
  if (len === 0) return null;
  const pct = len / max;
  const color = pct >= 1 ? '#dc2626' : pct >= 0.85 ? '#d97706' : '#9ca3af';
  const note  = pct >= 1 ? ' — Đã đạt giới hạn!' : pct >= 0.85 ? ' — Sắp đạt giới hạn' : '';
  return (
    <div style={{ textAlign: 'right', fontSize: 11, color, marginTop: 2 }}>
      {len}/{max} ký tự{note}
    </div>
  );
}

export default CharCount;
