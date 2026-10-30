import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PaymentStore} from '../server/payment-store.mjs';
import {PaymentService} from '../server/payment-service.mjs';
export async function paymentDatabaseTests({pool,embedded}){
 const adapter=pool||{query:(q,v)=>embedded.query(q,v),connect:async()=>({query:(q,v)=>embedded.query(q,v),release(){}})};
 const query=(q,v)=>adapter.query(q,v);
 const sql=await readFile(new URL('../payment-schema.sql',import.meta.url),'utf8');
 if(embedded)await embedded.exec(sql);else await pool.query(sql);
 const store=new PaymentStore(adapter);
 const sessionId=randomUUID();
 await query("insert into public.annex_sessions(id,title,starts_at,ends_at,status,price_amount) values($1,'PAYMENT TEST FIXTURE','2099-08-01T23:00Z','2099-08-02T01:00Z','open',2500)",[sessionId]);
 const inputs=Array.from({length:30},(_,i)=>({sessionId,requestKey:randomUUID(),name:'Test guest',email:'guest'+i+'@example.invalid'}));
 let attempts=[];
 if(pool)attempts=await Promise.allSettled(inputs.map(input=>store.begin(input,null)));
 else for(const input of inputs){try{attempts.push({status:'fulfilled',value:await store.begin(input,null)});}catch(reason){attempts.push({status:'rejected',reason});}}
 assert.equal(attempts.filter(r=>r.status==='fulfilled').length,18);
 assert.equal(attempts.filter(r=>r.status==='rejected' && /SESSION_FULL/.test(r.reason.message)).length,12);
 const winner=attempts.findIndex(r=>r.status==='fulfilled'), order=attempts[winner].value;
 assert.equal((await store.begin(inputs[winner],null)).id,order.id);
 await assert.rejects(store.begin({...inputs[winner],requestKey:randomUUID()},null),/BOOKING_EXISTS/);
 assert.equal(order.status,'pending');
 await assert.rejects(store.begin(inputs[winner],{id:'00000000-0000-0000-0000-000000000040'}),/INVALID_REQUEST/);
 assert.equal(order.amount,2500);
 // Test the real service with a deterministic provider; no API keys or real payments.
 const sessions=new Map();let creations=0,customerCreations=0;
 const stripe={
  customers:{create:async()=>{customerCreations++;return {id:'cus_test_member'};}},
  checkout:{sessions:{
   create:async(params)=>{
    creations++;
    const session={id:'cs_test_'+params.metadata.order_id,url:'https://checkout.stripe.com/c/pay/test',expires_at:params.expires_at,
     metadata:params.metadata,amount_total:params.line_items[0].price_data.unit_amount,currency:'usd',
     status:'open',payment_status:'unpaid',livemode:false,params};
    sessions.set(session.id,session);return session;
   },
   retrieve:async id=>sessions.get(id),
   expire:async id=>{const session=sessions.get(id);session.status='expired';return session;}
  }}
 };
 const service=new PaymentService(store,stripe,'http://localhost:8080/');
 const result=await service.checkout({...inputs[winner],amount:1},null);
 assert.equal(result.status,'pending');assert.match(result.url,/checkout.stripe.com/);
 await service.checkout(inputs[winner],null);assert.equal(creations,1);
 let saved=await store.byId(order.id), checkout=sessions.get(saved.stripe_session_id);
 assert.equal(checkout.params.line_items[0].price_data.unit_amount,2500);
 assert.equal(checkout.params.customer,undefined);
 assert.equal(checkout.params.saved_payment_method_options,undefined);
 assert.equal((await service.status(inputs[winner].requestKey)).status,'pending');
 checkout.status='complete';checkout.payment_status='paid';checkout.payment_intent={id:'pi_test',latest_charge:{receipt_url:'https://pay.stripe.com/receipts/test'}};
 await service.event({livemode:false,type:'checkout.session.completed',data:{object:checkout}});
 await service.event({livemode:false,type:'checkout.session.completed',data:{object:checkout}});
 assert.equal((await service.status(inputs[winner].requestKey)).status,'paid');
 assert.equal((await store.byId(order.id)).seat,order.seat);
 await assert.rejects(service.status(randomUUID()),/BOOKING_NOT_FOUND/);
 // Old event delivery cannot regress paid state; retrieve still says paid.
 await service.event({livemode:false,type:'checkout.session.expired',data:{object:{...checkout,status:'expired'}}});
 assert.equal((await store.byId(order.id)).status,'paid');

 // Refund notifications record money movement but do not invent a cancellation policy.
 let refundedAmount=500;
 stripe.charges={retrieve:async()=>({id:'ch_test',payment_intent:'pi_test',amount:2500,amount_refunded:refundedAmount,currency:'usd',livemode:false})};
 stripe.paymentIntents={retrieve:async()=>({id:'pi_test',metadata:{order_id:order.id}})};
 await service.event({livemode:false,type:'charge.refunded',data:{object:{id:'ch_test'}}});
 assert.equal((await store.byId(order.id)).refunded_amount,500);
 assert.equal((await store.byId(order.id)).status,'paid');
 refundedAmount=2500;
 await service.event({livemode:false,type:'charge.refunded',data:{object:{id:'ch_test'}}});
 await service.event({livemode:false,type:'charge.refunded',data:{object:{id:'ch_test'}}});
 assert.equal((await store.byId(order.id)).status,'refunded');
 assert.equal((await store.byId(order.id)).seat,order.seat);
 // Expire a second unpaid checkout, then verify capacity is released.
 const second=attempts.findIndex((r,i)=>r.status==='fulfilled' && i!==winner);
 await service.checkout(inputs[second],null);
 saved=await store.byId(attempts[second].value.id);checkout=sessions.get(saved.stripe_session_id);
 checkout.status='expired';
 await service.event({livemode:false,type:'checkout.session.expired',data:{object:checkout}});
 assert.equal((await store.byId(saved.id)).seat,null);
 const memberId='00000000-0000-0000-0000-000000000040';
 const member={id:memberId,email:'member@example.invalid',email_confirmed_at:new Date().toISOString()};
 const memberInput={sessionId,requestKey:randomUUID(),name:'Member',email:'untrusted@example.invalid'};
 await service.checkout(memberInput,member);
 assert.equal(customerCreations,1);
 const memberOrder=await store.byHash(memberInput.requestKey);
 assert.equal(memberOrder.email,'member@example.invalid');
 assert.equal(sessions.get(memberOrder.stripe_session_id).params.saved_payment_method_options.payment_method_save,'enabled');
 assert.equal((await store.history(memberId)).length,1);
 assert.equal((await store.history('00000000-0000-0000-0000-000000000041')).length,0);
 await assert.rejects(service.checkout({...memberInput,requestKey:randomUUID()},{...member,email_confirmed_at:null}),/VERIFIED_ACCOUNT_REQUIRED/);

 // A cancelled training day must not leave a payable pending checkout.
 await query("update public.annex_sessions set status='cancelled' where id=$1",[sessionId]);
 const cancelled=await service.status(memberInput.requestKey);
 assert.equal(cancelled.status,'expired');
 assert.equal((await store.byId(memberOrder.id)).seat,null);
 // Reopen only the synthetic fixture, and allocate another member for constraint checks.
 await query("update public.annex_sessions set status='open' where id=$1",[sessionId]);
 const newMemberOrder=await store.begin({...memberInput,requestKey:randomUUID(),email:member.email},member);
 // Hard slot constraints still protect capacity even for privileged server writes.
 await assert.rejects(query('update public.annex_registrations set seat=19 where id=$1',[newMemberOrder.id]),/check constraint/);
 await assert.rejects(query('update public.annex_registrations set seat=$1 where id=$2',[order.seat,newMemberOrder.id]),/unique constraint/);
 const permissionConnection=await adapter.connect();
 await permissionConnection.query('begin');
 try{
  await permissionConnection.query('set local role authenticated');
  await assert.rejects(permissionConnection.query("select public.register_annex_session($1,'unpaid bypass')",[sessionId]),/permission denied/);
 }finally{await permissionConnection.query('rollback');permissionConnection.release();}
 console.log('PASS: '+(pool?'30 concurrent':'30 serial')+' guest holds: 18 accepted; unpaid bypass denied; trusted pricing, verified payment, duplicate delivery, expiry, private status and member history.');
}
