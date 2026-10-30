import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutInput, safeCheckoutUrl, paymentTransition } from '../server/payment-rules.mjs';
test('guests need a name, email, UUID session and private request token',()=>{
 const data={sessionId:'00000000-0000-0000-0000-000000000001',requestKey:'00000000-0000-4000-8000-000000000002',name:' Player ',email:' PLAYER@example.com '};
 assert.equal(checkoutInput(data).email,'player@example.com');
 assert.throws(()=>checkoutInput({...data,email:'bad'}));
 assert.throws(()=>checkoutInput({...data,requestKey:'guessable'}));
});
test('redirects are restricted to hosted Stripe checkout',()=>{
 assert.equal(safeCheckoutUrl('https://checkout.stripe.com/c/pay/test'),true);
 assert.equal(safeCheckoutUrl('https://checkout.stripe.com.evil.invalid/'),false);
 assert.equal(safeCheckoutUrl('javascript:alert(1)'),false);
});
test('payment requires matching order, checkout, currency and exact server price',()=>{
 const order={id:'order',stripe_session_id:'cs_test',amount:1000,currency:'usd'};
 const session={id:'cs_test',metadata:{order_id:'order'},amount_total:1000,currency:'usd',status:'complete',payment_status:'paid',livemode:false};
 assert.equal(paymentTransition(order,session),'paid');
 assert.throws(()=>paymentTransition(order,{...session,amount_total:1}));
 assert.throws(()=>paymentTransition(order,{...session,metadata:{order_id:'wrong'}}));
 assert.throws(()=>paymentTransition(order,{...session,livemode:true}));
 assert.equal(paymentTransition(order,{...session,payment_status:'unpaid'}),'pending');
 assert.equal(paymentTransition(order,{...session,status:'expired',payment_status:'unpaid'}),'expired');
});
