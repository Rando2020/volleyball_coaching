const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const server=spawn('python3',['-m','http.server','8080','--bind','127.0.0.1'],{stdio:'ignore'});
process.on('exit',()=>server.kill());
(async()=>{
 for(let i=0;i<40;i++){try{await fetch('http://127.0.0.1:8080');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage({viewport:{width:390,height:844}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:8080');
 await page.getByText('No training dates have been published yet.').waitFor();
 assert.equal(await page.getByRole('button',{name:'Continue with Google'}).count(),0);
 assert.match(await page.locator('#auth-status').textContent(),/not connected/);
 for(const width of [320,390,768,1280]) {
  await page.setViewportSize({width,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 const month=await page.locator('#month-label').textContent();
 await page.getByRole('button',{name:'Next month'}).click();
 assert.notEqual(await page.locator('#month-label').textContent(),month);
 await page.getByRole('button',{name:'Previous month'}).click();
 assert.equal(await page.locator('#month-label').textContent(),month);
 // Fixture dates are tests only, never committed into sessions.json.
 const fixture={id:'test',title:'Training fixture',description:'<img src=x onerror=alert(1)>',starts_at:'2099-06-01T23:00:00Z',ends_at:'2099-06-02T01:00:00Z',capacity:18,status:'open',registered:2,is_registered:true};
 await page.route('**/sessions.json',r=>r.fulfill({json:[fixture]}));
 await page.reload();
 await page.getByText('Registration unavailable',{exact:true}).waitFor();
 assert.match(await page.locator('.capacity').first().textContent(),/availability not connected/);
 assert.equal(await page.locator('form').count(),0);
 await page.getByText('Session information',{exact:true}).click();
 assert.equal(await page.locator('.description img').count(),0);
 assert.match(await page.locator('.description').textContent(),/<img/);
 // Test UI against a deterministic API boundary, with controllable outcomes.
 await page.route('**/booking-api.mjs',r=>r.fulfill({contentType:'text/javascript',body:
  'export async function createBookingApi(){return {connected:true,user:{email:"test@example.invalid"},providers:["google"],list:async()=>{if(window.failRefresh)throw Error("offline");return [window.fixture]},register:async(id)=>{window.calls=(window.calls||0)+1;await new Promise(r=>setTimeout(r,150));if(window.full){window.fixture.registered=18;throw Error("SESSION_FULL")}window.fixture.is_registered=true;return {status:"confirmed",session_id:id}},signOut:async()=>{},signIn:async()=>{}}}' }));
 await page.addInitScript(f=>{window.fixture={...f,registered:17,is_registered:false};},fixture);
 await page.reload();
 await page.getByRole('button',{name:'Register for this day',exact:true}).waitFor();
 await page.getByLabel('Participant name').fill('Test Athlete');
 // Dispatch duplicate submit events directly, including the harder race before the response.
 await page.locator('form').evaluate(form=>{form.dispatchEvent(new Event('submit',{cancelable:true}));form.dispatchEvent(new Event('submit',{cancelable:true}));});
 await page.getByText('Registration confirmed. Your spot at the Annex is reserved.').waitFor();
 assert.equal(await page.evaluate(()=>window.calls),1);
 await page.getByText('Registered',{exact:true}).waitFor();
 await page.evaluate(()=>{window.fixture.is_registered=false;window.fixture.registered=17;window.full=true;});
 await page.getByRole('button',{name:'Refresh availability'}).click();
 await page.getByLabel('Participant name').fill('Test Athlete');
 await page.getByRole('button',{name:'Register for this day',exact:true}).click();
 await page.getByText('This training day just filled up. No spot was reserved.').waitFor();
 await page.getByText('Full',{exact:true}).waitFor();
 await page.evaluate(()=>{window.failRefresh=true;});
 await page.getByRole('button',{name:'Refresh availability'}).click();
 await page.getByText('Registration unavailable',{exact:true}).waitFor();
 assert.equal(await page.locator('form').count(),0);
 await page.evaluate(()=>{window.failRefresh=false;window.fixture.status='cancelled';});
 await page.getByRole('button',{name:'Refresh availability'}).click();
 await page.getByText('Session cancelled',{exact:true}).waitFor();
 // Keyboard-operable date and details controls.
 await page.locator('.scheduled').focus(); await page.keyboard.press('Enter');
 assert.equal(await page.locator('#selected-label').evaluate(el=>el===document.activeElement),true);

 // Exercise the real Supabase adapter and bundled SDK against mocked HTTP services.
 await page.unroute('**/booking-api.mjs');
 await page.route('**/booking-config.json',r=>r.fulfill({json:{supabaseUrl:'https://project.supabase.co',publishableKey:'sb_publishable_test',providers:['google']}}));
 await page.addInitScript(()=>{
   const payload=btoa(JSON.stringify({sub:'00000000-0000-0000-0000-000000000001',exp:4102444800,role:'authenticated'}));
   const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+payload+'.test';
   localStorage.setItem('sb-project-auth-token',JSON.stringify({access_token:token,refresh_token:'test',expires_at:4102444800,expires_in:3600,token_type:'bearer',user:{id:'00000000-0000-0000-0000-000000000001',email:'test@example.invalid'}}));
 });
 const user={id:'00000000-0000-0000-0000-000000000001',email:'test@example.invalid',user_metadata:{}};
 let realBooked=false, request;
 await page.route('https://project.supabase.co/auth/v1/user',r=>r.fulfill({json:user}));
 await page.route('https://project.supabase.co/rest/v1/rpc/list_annex_sessions',r=>r.fulfill({json:[{...fixture,registered:realBooked?18:17,is_registered:realBooked}]}));
 await page.route('https://project.supabase.co/rest/v1/rpc/register_annex_session',r=>{
   request=r.request().postDataJSON();realBooked=true;
   return r.fulfill({json:{status:'confirmed',session_id:'test',registration_id:'test-booking'}});
 });
 await page.reload();
 await page.getByRole('button',{name:'Register for this day',exact:true}).waitFor();
 await page.getByLabel('Participant name').fill('Real adapter test');
 await page.getByRole('button',{name:'Register for this day',exact:true}).click();
 await page.getByText('Registration confirmed. Your spot at the Annex is reserved.').waitFor();
 assert.deepEqual(request,{p_session_id:'test',p_attendee_name:'Real adapter test'});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/tmp/lvl-mobile-review.png',fullPage:true});

 assert.deepEqual(errors,[]);
 await browser.close(); server.kill();
 console.log('PASS: empty/configured calendars, four viewport widths, month navigation, text safety, keyboard, duplicate submit, last-seat race, refresh failure and cancellation.');
})().catch(e=>{console.error(e);process.exit(1)});
