import { validateSessions } from './booking-model.mjs';
export async function createBookingApi() {
  const response = await fetch('./booking-config.json', {cache:'no-store'});
  if (!response.ok) throw new Error('Configuration unavailable');
  const config = await response.json();
  if (!config.supabaseUrl && !config.publishableKey) return withPayments({
    connected:false, providers:[], user:null,
    async list() {
      const response = await fetch('./sessions.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Schedule unavailable');
      return validateSessions((await response.json()).map(s => ({...s, registered:null, is_registered:false})));
    }
  });
  if (!config.supabaseUrl?.startsWith('https://') || !config.publishableKey?.startsWith('sb_publishable_')) throw new Error('Public connection configuration is incomplete');
  const {createClient} = await import('./dist/supabase.js');
  const client = createClient(config.supabaseUrl, config.publishableKey, {auth:{flowType:'pkce', detectSessionInUrl:true}});
  const {error:sessionError} = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const {data:{user}, error} = await client.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError') throw error;
  const api = {
    connected:true, user,
    providers:(config.providers || []).filter(p => ['google','apple'].includes(p)),
    async list() {
      const {data,error} = await client.rpc('list_annex_sessions');
      if (error) throw error;
      return validateSessions(data);
    },
    async signIn(provider) {
      if (!api.providers.includes(provider)) throw new Error('Provider unavailable');
      const {error} = await client.auth.signInWithOAuth({provider, options:{redirectTo:new URL('./index.html', location.href).href}});
      if (error) throw error;
    },
    async signOut() {
      const {error} = await client.auth.signOut();
      if (error) throw error;
      location.reload();
    }
  };
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') location.reload();
  });
  return withPayments(api, client);
}


async function withPayments(api, client) {
  let config={enabled:false};
  try {
    const response=await fetch('./api/payments/config',{cache:'no-store'});
    if(response.ok)config=await response.json();
  }catch{}
  api.paymentsEnabled=config.enabled===true;
  api.paymentMode=config.mode;
  const call=async(path,body={})=>{
    const headers={'Content-Type':'application/json'};
    if(client){
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      if(data.session)headers.Authorization='Bearer '+data.session.access_token;
    }
    const response=await fetch('./api/payments/'+path,{method:'POST',headers,body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'PAYMENT_SERVICE_UNAVAILABLE');
    return data;
  };
  api.checkout=body=>call('checkout',body);
  api.paymentStatus=requestKey=>call('status',{requestKey});
  api.history=()=>call('history');
  api.portal=()=>call('portal');
  return api;
}
