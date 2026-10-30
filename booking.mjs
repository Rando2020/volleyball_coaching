import {calendarDays, trainingDay, bookingState} from './booking-model.mjs';
import {createBookingApi} from './booking-api.mjs';
const $ = id => document.getElementById(id);
const today = trainingDay(new Date());
let [year, month] = today.split('-').map(Number); month--;
const paidSessions = new Set();
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
    button.setAttribute('aria-label', dateLabel(day) + (session ? ', ' + bookingState(session, fresh && api?.connected, !!api?.paymentsEnabled).label : ', no training scheduled'));
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
  const found = sessions.find(s => s.id === selected);
  const session = found ? {...found,is_registered:found.is_registered || paidSessions.has(found.id)} : null;
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
  if (session.price_amount) host.append(element('p', new Intl.NumberFormat('en-US',{style:'currency',currency:session.currency||'usd'}).format(session.price_amount/100), 'session-time'));
  if(api?.paymentMode==='test')host.append(element('p','TEST CHECKOUT · No live registrations or charges','notice'));
  let remembered;
  try {remembered=JSON.parse(sessionStorage.getItem('lvl-payment-'+session.id));}catch{}
  if(remembered && api?.paymentsEnabled && !paidSessions.has(session.id)){
    const resume=element('button','Check or resume checkout','text-button');
    resume.type='button';resume.disabled=busy;
    resume.onclick=()=>book(session.id,remembered.name,remembered.email,remembered.requestKey);
    host.append(resume);
  }
  const state = bookingState(session, fresh && api?.connected, !!api?.paymentsEnabled);
  if (state.canBook) {
    const form = element('form');
    const label = element('label','Participant name');
    const input = element('input');
    input.name = 'attendee'; input.autocomplete = 'name'; input.required = true; input.maxLength = 120;
    input.value = api.user?.user_metadata?.full_name || '';
    label.append(input);
    const button = element('button', busy ? 'Opening checkout…' : state.label, 'primary');
    button.type = 'submit'; button.disabled = busy;
    const emailLabel=element('label','Email for your receipt');
    const email=element('input');email.type='email';email.name='email';email.autocomplete='email';email.required=true;email.maxLength=254;
    email.value=api.user?.email||'';email.readOnly=!!api.user;emailLabel.append(email);
    form.append(label,emailLabel,button,element('p',api.user ? 'Your account keeps your booking history. You can choose to save a card securely during checkout.' : 'No account required. Your spot is confirmed only after payment. Sign in first if you want account history and optional saved payment methods.', 'muted'));
    form.addEventListener('submit', event => {event.preventDefault(); book(session.id, input.value.trim(),email.value.trim());});
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
    $('auth-status').textContent = 'Accounts are optional. Sign in for booking history and the option to save payment methods.';
    for (const provider of api.providers) {
      const button = element('button','Continue with ' + (provider === 'google' ? 'Google' : 'Apple'));
      button.onclick = async () => {
        button.disabled = true;
        try {await api.signIn(provider);} catch {$('auth-status').textContent = 'Sign-in could not start. Please try again or contact Josiah.'; button.disabled = false;}
      };
      $('auth-actions').append(button);
    }
  } else {
    $('auth-status').textContent = 'Google and Apple sign-in are not connected yet. Guest checkout does not require an account.';
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
      ? (api.connected ? 'Availability includes checkout holds. Registration is confirmed only after successful payment.' : 'Schedule only. Online registration and live availability are not connected yet.')
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
function stripeLink(value,host) {
  try {const url=new URL(value);return url.protocol==='https:' && url.hostname===host;}catch{return false;}
}
async function book(id,name,email,requestKey) {
  if(busy || loading || !fresh || !api?.paymentsEnabled)return;
  let previous;
  try {previous=JSON.parse(sessionStorage.getItem('lvl-payment-'+id));}catch{}
  const request={sessionId:id,name,email,requestKey:requestKey||previous?.requestKey||crypto.randomUUID()};
  sessionStorage.setItem('lvl-payment-'+id,JSON.stringify(request));
  sessionStorage.setItem('lvl-active-payment',id);
  busy=true;renderDetails();$('booking-message').textContent='Opening secure checkout. Your place is not confirmed yet.';
  try{
    const result=await api.checkout(request);
    if(result.status==='paid'){
      $('booking-message').textContent='Payment verified. Your registration is confirmed.';
      paidSessions.add(id);
    }else if(result.status==='expired'){
      sessionStorage.removeItem('lvl-payment-'+id);
      $('booking-message').textContent='Checkout expired. You can try again if a spot is available.';
    }else if(stripeLink(result.url,'checkout.stripe.com'))location.assign(result.url);
    else throw Error('CHECKOUT_UNAVAILABLE');
  }catch(error){
    if(['SESSION_FULL','SESSION_CLOSED','PRICE_NOT_CONFIGURED','BOOKING_EXISTS','CHECKOUT_EXPIRED'].includes(error.message)){
      sessionStorage.removeItem('lvl-payment-'+id);sessionStorage.removeItem('lvl-active-payment');
    }
    $('booking-message').textContent=error.message==='SESSION_FULL' ? 'This day is full. No new checkout was started.'
      : error.message==='BOOKING_EXISTS' ? 'A booking or checkout already exists for this participant. Use the original checkout or contact Josiah.'
      : 'Checkout could not be verified. Check your payment status before trying again, or contact Josiah.';
  }finally{busy=false;await refresh();await paymentStatus();}
}
async function paymentStatus(){
  const id=sessionStorage.getItem('lvl-active-payment');
  let request;
  try{request=JSON.parse(sessionStorage.getItem('lvl-payment-'+id));}catch{}
  if(!request || !api?.paymentsEnabled)return;
  try{
    const result=await api.paymentStatus(request.requestKey);
    if(result.status==='paid'){
      $('booking-message').textContent='Payment verified. Your registration is confirmed.';
      paidSessions.add(id);
      renderDetails();
    }else if(result.status==='expired'){
      $('booking-message').textContent='Checkout expired without payment. The spot has been released.';
      sessionStorage.removeItem('lvl-payment-'+id);sessionStorage.removeItem('lvl-active-payment');
    }else if(result.status==='refunded'){
      paidSessions.delete(id);$('booking-message').textContent='Payment refunded. Contact Josiah about your registration.';renderDetails();
    }else $('booking-message').textContent='Payment is not confirmed yet. Check or resume checkout, or refresh payment status.';
  }catch{$('booking-message').textContent='Payment status could not be verified. Please refresh or contact Josiah before paying again.';}
}
async function history(){
  const host=$('booking-history');host.replaceChildren();
  if(!api?.user || !api.paymentsEnabled)return;
  host.append(element('h3','Your bookings and payments'));
  try{
    const {bookings}=await api.history();
    if(!bookings.length)host.append(element('p','No bookings are linked to this account yet.'));
    for(const booking of bookings){
      const row=element('article',null,'history-row');
      row.append(element('strong',booking.title),element('p',dateLabel(trainingDay(booking.starts_at))+' · '+booking.status));
      if(booking.amount)row.append(element('p',new Intl.NumberFormat('en-US',{style:'currency',currency:booking.currency}).format(booking.amount/100)));
      if(booking.refunded_amount)row.append(element('p','Refunded: '+new Intl.NumberFormat('en-US',{style:'currency',currency:booking.currency}).format(booking.refunded_amount/100)));
      if(booking.receipt_url && stripeLink(booking.receipt_url,'pay.stripe.com')){
        const link=element('a','View receipt');link.href=booking.receipt_url;link.target='_blank';link.rel='noopener noreferrer';row.append(link);
      }
      host.append(row);
    }
    host.append(element('p','Booking history records registrations, not verified attendance. Guest purchases are not automatically linked by email.','muted'));
    const button=element('button','Manage saved payment methods','text-button');
    button.onclick=async()=>{
      button.disabled=true;
      try{const {url}=await api.portal();if(!stripeLink(url,'billing.stripe.com'))throw Error();location.assign(url);}
      catch{$('auth-status').textContent='Payment management is unavailable or this account has not checked out yet.';button.disabled=false;}
    };host.append(button);
  }catch{host.append(element('p','Booking history could not be loaded. Please refresh.'));}
}
for (const [id, delta] of [['previous',-1],['next',1]]) {
  $(id).onclick = () => {
    const date = new Date(Date.UTC(year, month + delta, 1));
    year = date.getUTCFullYear(); month = date.getUTCMonth(); renderCalendar();
  };
}
$('refresh').onclick = async () => {await refresh(!sessions.length);await paymentStatus();await history();};
window.addEventListener('focus', () => refresh());
renderCalendar();
refresh(true).then(async()=>{await paymentStatus();await history();});
