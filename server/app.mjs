import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import Stripe from 'stripe';
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';
import {PaymentStore} from './payment-store.mjs';
import {PaymentService} from './payment-service.mjs';

// Deliberately sandbox-only. No live payment activation in this implementation.
export function paymentConfiguration(env){
 if(env.PAYMENTS_ENABLED!=='test')return null;
 if(!env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || !env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ||
 !env.DATABASE_URL || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.SITE_URL)throw Error('Incomplete sandbox payment configuration');
 return {siteUrl:new URL(env.SITE_URL).href};
}
export function createHandler({service,stripe,auth,webhookSecret,siteUrl,root=process.cwd()}){
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const attempts=new Map();
 const userFor=async req=>{
  if(!req.headers.authorization)return null;
  const token=req.headers.authorization.replace(/^Bearer /,'');
  const {data,error}=await auth.auth.getUser(token);
  if(error || !data.user || data.user.is_anonymous || !data.user.email_confirmed_at)throw Error('AUTH_REQUIRED');
  return data.user;
 };
 const bodyFor=async req=>{
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>65536)throw Error('REQUEST_TOO_LARGE');chunks.push(chunk);}
  return Buffer.concat(chunks);
 };
 return async (req,res)=>{
  const url=new URL(req.url,'http://localhost');
  try{
   if(url.pathname==='/api/payments/config')return send(res,200,{enabled:!!service,mode:service?'test':'disabled'});
   if(url.pathname.startsWith('/api/')){
    if(!service)return send(res,503,{error:'PAYMENTS_UNAVAILABLE'});
    if(url.pathname==='/api/payments/webhook' && req.method==='POST'){
     let event;
     try{event=stripe.webhooks.constructEvent(await bodyFor(req),req.headers['stripe-signature'],webhookSecret);}
     catch{return send(res,400,{error:'INVALID_SIGNATURE'});}
     await service.event(event);return send(res,200,{received:true});
    }
    // Same-origin JSON API. Never trust browser-supplied prices, customer IDs or user IDs.
    if(req.method!=='POST' || req.headers.origin!==new URL(siteUrl).origin || !String(req.headers['content-type']).startsWith('application/json'))
     return send(res,403,{error:'INVALID_ORIGIN'});
    const ip=req.socket.remoteAddress || 'unknown', now=Date.now();
    const limit=attempts.get(ip);
    if(limit && limit.until>now && limit.count>=60)return send(res,429,{error:'TRY_AGAIN_LATER'});
    attempts.set(ip,limit?.until>now?{...limit,count:limit.count+1}:{count:1,until:now+60000});
    if(attempts.size>10000)for(const [key,value] of attempts)if(value.until<now)attempts.delete(key);
    const body=JSON.parse((await bodyFor(req)).toString());
    if(url.pathname==='/api/payments/checkout')return send(res,200,await service.checkout(body,await userFor(req)));
    if(url.pathname==='/api/payments/status'){
     if(typeof body.requestKey!=='string' || body.requestKey.length>100)return send(res,400,{error:'INVALID_REQUEST'});
     return send(res,200,await service.status(body.requestKey));
    }
    const user=await userFor(req);
    if(!user)return send(res,401,{error:'AUTH_REQUIRED'});
    if(url.pathname==='/api/payments/history')return send(res,200,{bookings:await service.store.history(user.id)});
    if(url.pathname==='/api/payments/portal'){
     const customer=await service.store.customer(user.id);
     if(!customer)return send(res,404,{error:'NO_SAVED_PAYMENT_ACCOUNT'});
     const portal=await stripe.billingPortal.sessions.create({customer,return_url:new URL('index.html#account',siteUrl).href});
     return send(res,200,{url:portal.url});
    }
    return send(res,404,{error:'NOT_FOUND'});
   }
   // Explicit asset allowlist: never serve env files, server source, SQL or node_modules.
   const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
   if(!/^(index\.html|coaching\.html|account\.html|[a-z-]+\.(css|mjs|js)|booking-config\.json|sessions\.json|dist\/supabase\.js)$/.test(file))
    return send(res,404,{error:'NOT_FOUND'});
   if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'METHOD_NOT_ALLOWED'});
   const path=resolve(root,file);await stat(path);
   const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json'};
   res.writeHead(200,{'Content-Type':types[extname(path)]||'text/plain','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});
   if(req.method==='HEAD')return res.end();
   createReadStream(path).pipe(res);
  }catch(error){
   const known=/^(SESSION_|PRICE_|BOOKING_|CHECKOUT_|NAME_|INVALID_|VERIFIED_|AUTH_|NO_SAVED)/.test(error.message);
   send(res,known?409:503,{error:known?error.message:'PAYMENT_SERVICE_UNAVAILABLE'});
  }
 };
}
export async function start(env=process.env){
 const config=paymentConfiguration(env);
 let pool,service,stripe,auth;
 if(config){
  pool=new pg.Pool({connectionString:env.DATABASE_URL,max:10});
  stripe=new Stripe(env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:15000});
  auth=createClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  service=new PaymentService(new PaymentStore(pool),stripe,config.siteUrl);
 }
 const server=http.createServer(createHandler({service,stripe,auth,webhookSecret:env.STRIPE_WEBHOOK_SECRET,siteUrl:config?.siteUrl}));
 server.listen(Number(env.PORT||8080),'127.0.0.1',()=>console.log('LVL Up server listening; payments '+(config?'TEST ONLY':'disabled')));
 // A single sandbox process reconciles holds. Production needs a durable scheduled job.
 let running=false;
 const timer=service?setInterval(async()=>{if(running)return;running=true;try{
  const results=await service.reconcilePending();
  if(results.some(r=>!r.ok))console.error('Payment reconciliation needs operator review');
 }catch{console.error('Payment reconciliation unavailable');}finally{running=false;}},60000):null;
 timer?.unref();
 return {server,close:async()=>{clearInterval(timer);server.close();await pool?.end();}};
}
if(process.argv[1] && import.meta.url===new URL(process.argv[1],'file:').href)await start();
