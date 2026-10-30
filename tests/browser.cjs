const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const server=spawn('node',['server/app.mjs'],{stdio:'ignore'});
process.on('exit',()=>server.kill());
(async()=>{
 for(let i=0;i<40;i++){try{await fetch('http://127.0.0.1:8080');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:8080');
 await page.getByText('No training dates have been published yet.').waitFor();
 assert.equal(await page.getByRole('button',{name:'Continue with Google'}).count(),0);
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 const month=await page.locator('#month-label').textContent();
 await page.getByRole('button',{name:'Next month'}).click();
 assert.notEqual(await page.locator('#month-label').textContent(),month);
 await page.getByRole('button',{name:'Previous month'}).click();
 const fixture={id:'00000000-0000-0000-0000-000000000100',title:'Payment fixture',description:'<img src=x onerror=alert(1)>',starts_at:'2099-06-01T23:00:00Z',ends_at:'2099-06-02T01:00:00Z',capacity:18,status:'open',registered:17,is_registered:false,price_amount:2500,currency:'usd'};
 await page.route('**/sessions.json',r=>r.fulfill({json:[fixture]}));
 await page.reload();await page.getByText('Registration unavailable',{exact:true}).waitFor();
 assert.equal(await page.locator('form').count(),0);
 await page.getByText('Session information',{exact:true}).click();
 assert.equal(await page.locator('.description img').count(),0);
 // Real bundled Supabase SDK + adapter, mocked external HTTP only.
 await page.route('**/booking-config.json',r=>r.fulfill({json:{supabaseUrl:'https://project.supabase.co',publishableKey:'sb_publishable_test',providers:['google']}}));
 await page.route('**/api/payments/config',r=>r.fulfill({json:{enabled:true,mode:'test'}}));
 let paid=false,failRefresh=false,checkoutCalls=0,full=false;
 await page.route('https://project.supabase.co/rest/v1/rpc/list_annex_sessions',r=>failRefresh?r.fulfill({status:503,json:{message:'Unavailable'}}):r.fulfill({json:[{...fixture,registered:paid||full?18:17}]}));
 await page.route('**/api/payments/checkout',async r=>{
  checkoutCalls++;const body=r.request().postDataJSON();
  assert.equal(body.email,'guest@example.invalid');assert.equal(body.name,'Guest');
  assert.equal('amount' in body,false);assert.equal('userId' in body,false);
  assert.equal(r.request().headers().authorization,undefined);
  await new Promise(resolve=>setTimeout(resolve,200));
  if(full)return r.fulfill({status:409,json:{error:'SESSION_FULL'}});
  return r.fulfill({json:{status:'pending',url:'https://checkout.stripe.com/c/pay/test'}});
 });
 await page.route('**/api/payments/status',r=>r.fulfill({json:{status:paid?'paid':'pending',amount:2500,currency:'usd'}}));
 await page.route('https://checkout.stripe.com/**',r=>r.fulfill({contentType:'text/html',body:'<h1>Test Stripe checkout</h1>'}));
 await page.reload();
 await page.getByRole('button',{name:'Pay and register',exact:true}).waitFor();
 assert.match(await page.locator('#session-details').textContent(),/No account required/);
 await page.getByLabel('Participant name').fill('Guest');
 await page.getByLabel('Email for your receipt').fill('guest@example.invalid');
 await page.locator('form').evaluate(form=>{form.dispatchEvent(new Event('submit',{cancelable:true}));form.dispatchEvent(new Event('submit',{cancelable:true}));});
 await page.getByRole('heading',{name:'Test Stripe checkout'}).waitFor();assert.equal(checkoutCalls,1);
 await page.goto('http://127.0.0.1:8080/index.html#payment-return');
 await page.getByText('Payment is not confirmed yet. Check or resume checkout, or refresh payment status.').waitFor();
 assert.equal(await page.getByText('Payment verified. Your registration is confirmed.',{exact:true}).count(),0);
 paid=true;
 await page.getByRole('button',{name:'Refresh availability'}).click();
 await page.getByText('Payment verified. Your registration is confirmed.').waitFor();
 await page.getByText('Registered',{exact:true}).waitFor();
 await page.reload();
 await page.getByText('Payment verified. Your registration is confirmed.').waitFor();
 // Start a fresh visitor and prove full response does not confirm or charge via UI.
 await page.evaluate(()=>sessionStorage.clear());paid=false;
 await page.reload();
 await page.getByLabel('Participant name').fill('Guest');
 await page.getByLabel('Email for your receipt').fill('guest@example.invalid');
 full=true;
 await page.getByRole('button',{name:'Pay and register',exact:true}).click();
 await page.getByText('This day is full. No new checkout was started.').waitFor();
 await page.getByText('Full',{exact:true}).waitFor();
 failRefresh=true;
 await page.getByRole('button',{name:'Refresh availability'}).click();
 await page.getByText('Registration unavailable',{exact:true}).waitFor();
 assert.equal(await page.locator('form').count(),0);
 // Member history is loaded through authenticated API, not public email matching.
 failRefresh=false;full=false;
 const user={id:'00000000-0000-0000-0000-000000000001',email:'member@example.invalid',email_confirmed_at:new Date().toISOString(),user_metadata:{}};
 await page.addInitScript(user=>{
  const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,exp:4102444800,role:'authenticated'}))+'.test';
  localStorage.setItem('sb-project-auth-token',JSON.stringify({access_token:token,refresh_token:'test',expires_at:4102444800,expires_in:3600,token_type:'bearer',user}));
 },user);
 await page.route('https://project.supabase.co/auth/v1/user',r=>r.fulfill({json:user}));
 await page.route('**/api/payments/history',r=>{
  assert.match(r.request().headers().authorization,/^Bearer /);
  return r.fulfill({json:{bookings:[{...fixture,status:'paid',amount:2500,receipt_url:'https://pay.stripe.com/receipts/test'}]}});
 });
 await page.reload();
 await page.getByRole('heading',{name:'Your bookings and payments'}).waitFor();
 await page.getByRole('link',{name:'View receipt'}).waitFor();
 assert.equal(await page.getByLabel('Email for your receipt').inputValue(),'member@example.invalid');
 await page.locator('.scheduled').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#selected-label').evaluate(el=>el===document.activeElement),true);
 assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/lvl-payment-mobile.png',fullPage:true});
 await browser.close();server.kill();
 console.log('PASS: guest checkout, real SDK adapter, no premature confirmation, duplicate submit, verified return/reload, full/error states, member history, keyboard, XSS and mobile widths.');
})().catch(error=>{console.error(error);process.exit(1)});
