import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, trainingDay, bookingState, validateSessions } from '../booking-model.mjs';

test('calendar handles leap February and Sunday alignment', () => {
  const cells = calendarDays(2028, 1);
  assert.equal(cells.filter(Boolean).length, 29);
  assert.equal(cells.indexOf('2028-02-01'), 2);
  assert.equal(cells.length % 7, 0);
});
test('training date uses Chicago, not browser timezone', () => {
  assert.equal(trainingDay('2026-11-02T00:30:00Z'), '2026-11-01');
});
const session = {id:'a', starts_at:'2099-06-01T23:00:00Z', ends_at:'2099-06-02T01:00:00Z', title:'Test fixture', description:'', status:'open', capacity:18, registered:17, price_amount:1000, currency:'usd'};
test('unknown availability and disconnected backend cannot offer reservations', () => {
  assert.equal(bookingState(session, false, true).canBook, false);
  assert.equal(bookingState({...session, registered:null}, true, true).canBook, false);
});
test('full, closed, past and already registered states are distinct', () => {
  assert.equal(bookingState({...session, registered:18}, true, true).label, 'Full');
  assert.equal(bookingState({...session, status:'closed'}, true, true).label, 'Registration closed');
  assert.equal(bookingState({...session, starts_at:'2020-01-01T18:00:00Z'}, true, true).label, 'Session started');
  assert.equal(bookingState({...session, is_registered:true}, true, true).label, 'Registered');
  assert.equal(bookingState(session, true, true).canBook, true);
});
test('reject malformed dates, duplicate training days and capacity above 18', () => {
  assert.throws(() => validateSessions([{...session, capacity:19}]));
  assert.throws(() => validateSessions([{...session, starts_at:'bad'}]));
  assert.throws(() => validateSessions([session, {...session, id:'b'}]));
  assert.deepEqual(validateSessions([]), []);
});
