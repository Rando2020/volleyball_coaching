import {calendarDays, trainingDay, bookingState} from './booking-model.mjs';
import {createBookingApi} from './booking-api.mjs';
const $ = id => document.getElementById(id);
const today = trainingDay(new Date());
let [year, month] = today.split('-').map(Number); month--;
let api, sessions = [], selected = null, fresh = false, busy = false, loading = false;
const dateLabel = day => new Intl.DateTimeFormat('en-US', {dateStyle:'full', timeZone:'UTC'}).format(new Date(day + 'T12:00:00Z'));
const timeLabel = value => new Intl.DateTimeFormat('en-US', {hour:'numeric',minute:'2-digit',timeZone:'America/Chicago', timeZoneName:'short'}).format(new Date(value));
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function renderCalendar() {
  $('month-label').textContent = new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month,1)));
  $('days').replaceChildren();
  for (const day of calendarDays(year,month)) {
    if (!day) { $('days').append(element('span')); continue; }
    const session = sessions.find(s => trainingDay(s.starts_at) === day);
    const button = element('button', String(Number(day.slice(-2))), 'day' + (session ? ' scheduled' : '') + (day === today ? ' today' : ''));
    button.type = 'button'; button.disabled = !session || busy;
    button.setAttribute('aria-label', dateLabel(day) + (session ? ', ' + bookingState(session, fresh && api?.connected, !!api?.user).label : ', no training scheduled'));
    if (day === today) button.setAttribute('aria-current','date');
    if (session) button.setAttribute('aria-pressed', String(selected === session.id));
    button.addEventListener('click', () => {
      selected = session.id;
      sessionStorage.setItem('lvl-selected-session', selected);
      $('booking-message').textContent = '';
      renderCalendar(); renderDetails();
      $('selected-label').tabIndex = -1; $('selected-label').focus();
    });
    $('days').append(button);
  }
}
function renderDetails() {
  const host = $('session-details');
  host.replaceChildren();
  const session = sessions.find(s => s.id === selected);
  if (!session) {
    $('selected-label').textContent = 'Choose a date';
    host.append(element('p', sessions.length ? 'Select a highlighted day on the calendar.' : 'Confirmed training dates will appear here once published.', 'muted'));
    return;
  }
  $('selected-label').textContent = dateLabel(trainingDay(session.starts_at));
  host.append(element('h3', session.title));
  host.append(element('p', timeLabel(session.starts_at) + ' – ' + timeLabel(session.ends_at), 'session-time'));
  host.append(element('p', 'Annex · 1 court', 'muted'));
  const countKnown = fresh && api?.connected && session.registered != null;
  host.append(element('p', countKnown ? (18 - session.registered) + ' of 18 spots available · checked just now' : '18 participants maximum · availability not connected or could not be verified', 'capacity'));
  const details = element('details');
  details.append(element('summary','Session information'), element('p',session.description || 'Additional session information has not been published.', 'description'));
  host.append(details);
  const state = bookingState(session, fresh && api?.connected, !!api?.user);
  if (state.canBook) {
    const form = element('form');
    const label = element('label','Participant name');
    const input = element('input');
    input.name = 'attendee'; input.autocomplete = 'name'; input.required = true; input.maxLength = 120;
    input.value = api.user.user_metadata?.full_name || '';
    label.append(input);
    const button = element('button', busy ? 'Confirming…' : state.label, 'primary');
    button.type = 'submit'; button.disabled = busy;
    form.append(label,button,element('p','One participant per account per training day. Your spot is reserved only after confirmation.', 'muted'));
    form.addEventListener('submit', event => {event.preventDefault(); book(session.id, input.value.trim());});
    host.append(form);
  } else {
    host.append(element('p',state.label, 'capacity'));
    if (state.label === 'Sign in to register') {
      const link = element('a','Continue to sign-in'); link.href = '#account'; host.append(link);
    }
  }
}
function renderAuth() {
  $('auth-actions').replaceChildren();
  if (api?.user) {
    $('auth-status').textContent = 'Signed in as ' + (api.user.email || 'your account') + '.';
    const button = element('button','Sign out');
    button.onclick = async () => {
      button.disabled = true;
      try {await api.signOut();} catch {$('auth-status').textContent = 'Sign-out failed. Please try again.'; button.disabled=false;}
    };
    $('auth-actions').append(button);
  } else if (api?.connected && api.providers.length) {
    $('auth-status').textContent = 'Sign in to register and see your booking status.';
    for (const provider of api.providers) {
      const button = element('button','Continue with ' + (provider === 'google' ? 'Google' : 'Apple'));
      button.onclick = async () => {
        button.disabled = true;
        try {await api.signIn(provider);} catch {$('auth-status').textContent = 'Sign-in could not start. Please try again or contact Josiah.'; button.disabled = false;}
      };
      $('auth-actions').append(button);
    }
  } else {
    $('auth-status').textContent = 'Google and Apple sign-in are not connected yet. Online registration is unavailable.';
  }
}
async function refresh(initial = false) {
  if (loading || busy) return;
  loading = true; fresh = false;
  $('refresh').disabled = true;
  $('schedule-status').textContent = 'Checking the schedule…';
  renderDetails();
  try {
    if (!api) api = await createBookingApi();
    renderAuth();
    sessions = await api.list(); fresh = true;
    if (initial) {
      const saved = sessionStorage.getItem('lvl-selected-session');
      const first = sessions.find(s => s.id === saved) || sessions.find(s => Date.parse(s.starts_at) > Date.now()) || sessions[0];
      if (first) {selected = first.id; [year,month] = trainingDay(first.starts_at).split('-').map(Number); month--;}
    }
    $('schedule-status').textContent = sessions.length
      ? (api.connected ? 'Availability checked. Your spot is confirmed only when registration succeeds.' : 'Schedule only. Online registration and live availability are not connected yet.')
      : 'No training dates have been published yet.';
  } catch {
    fresh = false;
    $('schedule-status').textContent = 'The schedule could not be verified. Registration is unavailable. Please refresh to try again.';
    if (!api) $('auth-status').textContent = 'Sign-in is unavailable. Please refresh or contact Josiah.';
  } finally {
    loading = false; $('refresh').disabled = false;
    renderCalendar(); renderDetails();
  }
}
async function book(id, name) {
  if (busy || loading || !fresh || !name || !api?.user) return;
  busy = true; renderCalendar(); renderDetails();
  $('booking-message').textContent = 'Confirming your place with the server…';
  let confirmed = false;
  try {
    const result = await api.register(id, name);
    if (result?.status !== 'confirmed' || result.session_id !== id) throw new Error('Unexpected response');
    confirmed = true;
    const session = sessions.find(s => s.id === id);
    if (session) session.is_registered = true;
    $('booking-message').textContent = 'Registration confirmed. Your spot at the Annex is reserved.';
  } catch (error) {
    $('booking-message').textContent = /SESSION_FULL/.test(error.message) ? 'This training day just filled up. No spot was reserved.'
      : /SESSION_CLOSED/.test(error.message) ? 'Registration for this day is closed.'
      : 'We could not confirm the response. Refresh your registration status before trying again; repeat requests cannot reserve a second spot.';
  } finally {
    busy = false;
    await refresh();
    if (confirmed && !fresh) $('booking-message').textContent = 'Your registration was confirmed. Availability could not be refreshed.';
  }
}
for (const [id, delta] of [['previous',-1],['next',1]]) {
  $(id).onclick = () => {
    const date = new Date(Date.UTC(year, month + delta, 1));
    year = date.getUTCFullYear(); month = date.getUTCMonth(); renderCalendar();
  };
}
$('refresh').onclick = () => refresh(!sessions.length);
window.addEventListener('focus', () => refresh());
renderCalendar();
refresh(true);
