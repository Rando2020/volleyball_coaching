import { validateSessions } from './booking-model.mjs';
export async function createBookingApi() {
  const response = await fetch('./booking-config.json', {cache:'no-store'});
  if (!response.ok) throw new Error('Configuration unavailable');
  const config = await response.json();
  if (!config.supabaseUrl && !config.publishableKey) return {
    connected:false, providers:[], user:null,
    async list() {
      const response = await fetch('./sessions.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Schedule unavailable');
      return validateSessions((await response.json()).map(s => ({...s, registered:null, is_registered:false})));
    }
  };
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
    async register(id, name) {
      const {data,error} = await client.rpc('register_annex_session', {p_session_id:id, p_attendee_name:name});
      if (error) throw error;
      return data;
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
  return api;
}
