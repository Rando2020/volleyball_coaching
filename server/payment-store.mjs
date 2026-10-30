import {hashKey} from './payment-rules.mjs';
export class PaymentStore {
 constructor(pool){this.pool=pool;}
 async transaction(fn) {
  const db=await this.pool.connect();
  try {await db.query('begin');const result=await fn(db);await db.query('commit');return result;}
  catch(error){await db.query('rollback');throw error;}
  finally{db.release();}
 }
 async begin(input,user) {
  return this.transaction(async db=>{
   const {rows:[session]}=await db.query('select * from public.annex_sessions where id=$1 for update',[input.sessionId]);
   if(!session)throw Error('SESSION_NOT_FOUND');
   const {rows:[previous]}=await db.query('select * from public.annex_registrations where request_hash=$1',[hashKey(input.requestKey)]);
   if(previous){
    if(previous.session_id!==input.sessionId || previous.user_id!==(user?.id||null)) throw Error('INVALID_REQUEST');
    return {...previous,title:session.title};
   }
   if(session.status!=='open' || new Date(session.starts_at)<=new Date(Date.now()+36*60*1000)) throw Error('SESSION_CLOSED');
   if(!session.price_amount)throw Error('PRICE_NOT_CONFIGURED');
   // Unique email/account is only a duplicate safeguard, never proof of ownership.
   const {rows:duplicate}=await db.query("select 1 from public.annex_registrations where session_id=$1 and seat is not null and (email=$2 or user_id=$3)",[input.sessionId,input.email,user?.id||null]);
   if(duplicate.length)throw Error('BOOKING_EXISTS');
   const {rows:[seat]}=await db.query('select n from generate_series(1,18) n where not exists(select 1 from public.annex_registrations where session_id=$1 and seat=n) order by n limit 1',[input.sessionId]);
   if(!seat)throw Error('SESSION_FULL');
   const {rows:[order]}=await db.query("insert into public.annex_registrations(session_id,user_id,seat,attendee_name,email,request_hash,status,amount,currency,checkout_title) values($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9) returning *",[input.sessionId,user?.id||null,seat.n,input.name,input.email,hashKey(input.requestKey),session.price_amount,session.currency,session.title]);
   return {...order,title:session.title};
  });
 }
 async byHash(key){return (await this.pool.query('select * from public.annex_registrations where request_hash=$1',[hashKey(key)])).rows[0];}
 async byId(id){return (await this.pool.query('select * from public.annex_registrations where id=$1',[id])).rows[0];}
 async attach(id,session){
  const {rows:[row]}=await this.pool.query('update public.annex_registrations set stripe_session_id=$2,checkout_url=$3,checkout_expires_at=to_timestamp($4) where id=$1 and (stripe_session_id is null or stripe_session_id=$2) returning *',[id,session.id,session.url,session.expires_at]);
  if(!row)throw Error('PAYMENT_MISMATCH'); return row;
 }
 async transition(id,status,session) {
  // Expired holds release only after Stripe has authoritatively expired checkout.
  // A paid record never regresses due to a duplicate or old expiry event.
  await this.pool.query("update public.annex_registrations set status=$2,seat=case when $2='expired' then null else seat end,paid_at=case when $2='paid' then now() else paid_at end,payment_intent_id=$3,receipt_url=$4 where id=$1 and status='pending'",
   [id,status,typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||null,session.payment_intent?.latest_charge?.receipt_url||null]);
  return this.byId(id);
 }
 async customer(userId){return (await this.pool.query('select stripe_customer_id from booking_private.payment_customers where user_id=$1',[userId])).rows[0]?.stripe_customer_id;}
 async saveCustomer(userId,id){await this.pool.query('insert into booking_private.payment_customers(user_id,stripe_customer_id) values($1,$2) on conflict(user_id) do nothing',[userId,id]);return this.customer(userId);}
 async refund(order,charge){
  if(charge.livemode!==false || charge.amount!==order.amount || charge.currency!==order.currency ||
    !Number.isInteger(charge.amount_refunded) || charge.amount_refunded<0 || charge.amount_refunded>order.amount)throw Error('PAYMENT_MISMATCH');
  await this.pool.query("update public.annex_registrations set refunded_amount=greatest(refunded_amount,$2),status=case when $2=amount then 'refunded' else status end where id=$1 and status in ('paid','refunded')",[order.id,charge.amount_refunded]);
 }
 async history(userId){return (await this.pool.query('select r.id,r.status,r.amount,r.currency,r.paid_at,r.receipt_url,r.refunded_amount,s.title,s.starts_at from public.annex_registrations r join public.annex_sessions s on s.id=r.session_id where r.user_id=$1 order by s.starts_at desc',[userId])).rows;}
 async pending(){return (await this.pool.query("select r.*,s.title from public.annex_registrations r join public.annex_sessions s on s.id=r.session_id where r.status='pending' order by r.created_at limit 100")).rows;}
}
