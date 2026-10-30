export function trainingDay(value) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date(value));
}
export function calendarDays(year, month) {
  const start = new Date(Date.UTC(year, month, 1));
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array(start.getUTCDay()).fill(null);
  for (let day = 1; day <= count; day++) cells.push([year,String(month + 1).padStart(2,'0'),String(day).padStart(2,'0')].join('-'));
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function validateSessions(sessions) {
  if (!Array.isArray(sessions)) throw new Error('Invalid schedule');
  const dates = new Set(), ids = new Set();
  for (const s of sessions) {
    if (!s.id || ids.has(s.id) || typeof s.title !== 'string' || !s.title.trim() || typeof s.description !== 'string' || !['open','closed','cancelled'].includes(s.status) || s.capacity !== 18 || !Number.isFinite(Date.parse(s.starts_at)) || !Number.isFinite(Date.parse(s.ends_at)) || Date.parse(s.ends_at) <= Date.parse(s.starts_at)) throw new Error('Invalid session');
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(s.starts_at) || !/(Z|[+-]\d{2}:\d{2})$/.test(s.ends_at)) throw new Error('Timezone offset required');
    const day = trainingDay(s.starts_at);
    if (dates.has(day)) throw new Error('Only one Annex training session per day');
    if (s.registered != null && (!Number.isInteger(s.registered) || s.registered < 0 || s.registered > 18)) throw new Error('Invalid availability');
    dates.add(day); ids.add(s.id);
  }
  return sessions;
}
export function bookingState(s, connected, paymentsEnabled, now = Date.now()) {
  if (s.status === 'cancelled') return {label:'Session cancelled', canBook:false};
  if (s.is_registered) return {label:'Registered', canBook:false};
  if (Date.parse(s.starts_at) <= now) return {label:'Session started', canBook:false};
  if (s.status !== 'open') return {label:'Registration closed', canBook:false};
  if (!connected || s.registered == null) return {label:'Registration unavailable', canBook:false};
  if (s.registered >= 18) return {label:'Full', canBook:false};
  if (!paymentsEnabled) return {label:'Online payment is not connected yet', canBook:false};
  if (!Number.isInteger(s.price_amount) || s.price_amount <= 0 || s.currency !== 'usd') return {label:'Price not published', canBook:false};
  return {label:'Pay and register', canBook:true};
}
