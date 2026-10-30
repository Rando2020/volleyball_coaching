import {createHash} from 'node:crypto';
export const hashKey = key => createHash('sha256').update(key).digest('hex');
export function checkoutInput(data) {
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(data?.sessionId) || !uuid.test(data?.requestKey)) throw Error('INVALID_REQUEST');
 const name=String(data.name||'').trim(), email=String(data.email||'').trim().toLowerCase();
 if(!name || name.length>120 || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('NAME_AND_EMAIL_REQUIRED');
 return {sessionId:data.sessionId,requestKey:data.requestKey,name,email};
}
export function safeCheckoutUrl(value) {
 try {const url=new URL(value);return url.protocol==='https:' && url.hostname==='checkout.stripe.com';}catch{return false;}
}
export function paymentTransition(order, session) {
 if(session.livemode !== false || session.metadata?.order_id !== order.id || session.id !== order.stripe_session_id ||
 session.amount_total !== order.amount || session.currency !== order.currency) throw Error('PAYMENT_MISMATCH');
 if(session.status==='complete' && session.payment_status==='paid') return 'paid';
 if(session.status==='expired' && session.payment_status==='unpaid') return 'expired';
 return 'pending';
}
