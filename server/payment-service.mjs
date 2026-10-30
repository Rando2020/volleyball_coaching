import {checkoutInput,paymentTransition,safeCheckoutUrl} from './payment-rules.mjs';
export class PaymentService {
 constructor(store,stripe,siteUrl){this.store=store;this.stripe=stripe;this.siteUrl=siteUrl;}
 async customer(order) {
  if(!order.user_id)return null;
  let id=await this.store.customer(order.user_id);
  if(!id){
   // Stable parameters and key make concurrent first purchases safe.
   const customer=await this.stripe.customers.create({metadata:{lvl_user_id:order.user_id}},{idempotencyKey:'lvl-customer-'+order.user_id});
   id=await this.store.saveCustomer(order.user_id,customer.id);
  }
  return id;
 }
 async ensureCheckout(order) {
  if(order.stripe_session_id)return order;
  const customer=await this.customer(order);
  const expires=Math.floor(new Date(order.created_at).getTime()/1000)+35*60;
  // An uncertain provider response must never release a seat or create a new payment.
  // Reconcile promptly; older unattached holds require operator investigation.
  if(expires < Math.floor(Date.now()/1000)+30*60)throw Error('CHECKOUT_REVIEW_REQUIRED');
  const session=await this.stripe.checkout.sessions.create({
   mode:'payment',payment_method_types:['card'],
   line_items:[{price_data:{currency:order.currency,unit_amount:order.amount,product_data:{name:order.checkout_title||order.title}},quantity:1}],
   client_reference_id:order.id,metadata:{order_id:order.id},expires_at:expires,
   ...(customer ? {customer,saved_payment_method_options:{payment_method_save:'enabled',payment_method_remove:'enabled'}} : {customer_email:order.email}),
   payment_intent_data:{receipt_email:order.email,metadata:{order_id:order.id}},
   // Fragment carries no token. The private request key remains in sessionStorage.
   success_url:new URL('index.html#payment-return',this.siteUrl).href,
   cancel_url:new URL('index.html#payment-return',this.siteUrl).href
  },{idempotencyKey:'lvl-checkout-'+order.id});
  if(session.livemode || !safeCheckoutUrl(session.url))throw Error('PAYMENT_CONFIGURATION_ERROR');
  return this.store.attach(order.id,session);
 }
 async checkout(data,user) {
  const input=checkoutInput(data);
  if(user){
   if(!user.email_confirmed_at || user.is_anonymous)throw Error('VERIFIED_ACCOUNT_REQUIRED');
   input.email=user.email.toLowerCase();
  }
  let order=await this.store.begin(input,user);
  if(order.status==='paid')return {status:'paid'};
  if(order.status!=='pending')throw Error('CHECKOUT_EXPIRED');
  order=await this.ensureCheckout(order);
  const current=await this.reconcile(order);
  if(current.status!=='pending')return {status:current.status};
  if(current.session_status!=='open')throw Error('SESSION_CLOSED');
  return {status:'pending',url:order.checkout_url};
 }
 async reconcile(order) {
  if(!order.stripe_session_id || !['pending','paid'].includes(order.status))return order;
  order=await this.store.byId(order.id);
  let session=await this.stripe.checkout.sessions.retrieve(order.stripe_session_id,{expand:['payment_intent.latest_charge']});
  if(session.status==='open' && (order.session_status!=='open' || new Date(order.session_starts_at)<=new Date())){
    // Expire at the provider before releasing capacity, including cancellation races.
    try{await this.stripe.checkout.sessions.expire(session.id);}catch{/* Payment may have completed concurrently. Retrieve before deciding. */}
    session=await this.stripe.checkout.sessions.retrieve(session.id,{expand:['payment_intent.latest_charge']});
  }
  const status=paymentTransition(order,session);
  if(status==='paid' || status==='expired')return this.store.transition(order.id,status,session);
  return order;
 }
 async status(key){
  const order=await this.store.byHash(key);
  if(!order)throw Error('BOOKING_NOT_FOUND');
  const current=await this.reconcile(order);
  return {status:current.status,amount:current.amount,currency:current.currency,receipt_url:current.receipt_url};
 }
 async event(event){
  if(event.livemode!==false)throw Error('LIVE_PAYMENTS_DISABLED');
  if(event.type==='charge.refunded'){
   const charge=await this.stripe.charges.retrieve(event.data.object.id);
   const intent=await this.stripe.paymentIntents.retrieve(typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent.id);
   let order=intent.metadata?.order_id?await this.store.byId(intent.metadata.order_id):null;
   if(!order)return;
   order=await this.reconcile(order);
   if(order.payment_intent_id!==intent.id)throw Error('PAYMENT_MISMATCH');
   await this.store.refund(order,charge);return;
  }
  if(!['checkout.session.completed','checkout.session.expired','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed'].includes(event.type))return;
  const payload=event.data.object;
  const order=payload.metadata?.order_id ? await this.store.byId(payload.metadata.order_id) : null;
  if(!order)return;
  // Retrieve authoritative state instead of trusting event order or delivery timing.
  if(!order.stripe_session_id){
   const current=await this.stripe.checkout.sessions.retrieve(payload.id);
   paymentTransition({...order,stripe_session_id:current.id},current);
   await this.store.attach(order.id,current);
  } else if(order.stripe_session_id!==payload.id)throw Error('PAYMENT_MISMATCH');
  await this.reconcile(await this.store.byId(order.id));
 }
 async reconcilePending(){
  const results=[];
  for(let order of await this.store.pending()){
   try{order=await this.ensureCheckout(order);await this.reconcile(order);results.push({id:order.id,ok:true});}
   catch{results.push({id:order.id,ok:false});}
  }
  return results;
 }
}
