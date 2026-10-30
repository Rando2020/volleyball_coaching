import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import Stripe from 'stripe';
import {createHandler,paymentConfiguration} from '../server/app.mjs';
test('payment server cannot activate live keys',()=>{
 assert.equal(paymentConfiguration({}),null);
 assert.throws(()=>paymentConfiguration({PAYMENTS_ENABLED:'test',STRIPE_SECRET_KEY:'sk_live_forbidden'}));
});
test('webhook requires a valid signature; guests work, invalid identities cannot downgrade to guest',async()=>{
 const stripe=new Stripe('sk_test_fake'), secret='whsec_test_only';
 let events=0,guestCalls=0;
 const service={event:async()=>{events++;},checkout:async(body,user)=>{assert.equal(user,null);guestCalls++;return {status:'pending'};}};
 const auth={auth:{getUser:async()=>({error:Error('invalid'),data:{user:null}})}};
 const server=http.createServer(createHandler({service,stripe,auth,webhookSecret:secret,siteUrl:'http://localhost'}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 try{
  const payload=JSON.stringify({id:'evt_test',livemode:false,type:'checkout.session.completed',data:{object:{}}});
  const signature=stripe.webhooks.generateTestHeaderString({payload,secret});
  let response=await fetch(url+'/api/payments/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload});
  assert.equal(response.status,200);assert.equal(events,1);
  response=await fetch(url+'/api/payments/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload+' '});
  assert.equal(response.status,400);assert.equal(events,1);
  response=await fetch(url+'/api/payments/checkout',{method:'POST',headers:{Origin:'http://localhost','Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,200);assert.equal(guestCalls,1);
  response=await fetch(url+'/api/payments/checkout',{method:'POST',headers:{Origin:'http://localhost','Content-Type':'application/json',Authorization:'Bearer forged'},body:'{}'});
  assert.equal(response.status,409);assert.equal(guestCalls,1);
  response=await fetch(url+'/api/payments/checkout',{method:'POST',headers:{Origin:'https://evil.invalid','Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,403);
  response=await fetch(url+'/.env');assert.equal(response.status,404);
  response=await fetch(url+'/server/app.mjs');assert.equal(response.status,404);
 }finally{await new Promise(r=>server.close(r));}
});
