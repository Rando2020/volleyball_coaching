// DATABASE_URL must refer to a disposable database, never production.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const setup = await readFile(new URL('../booking-schema.sql', import.meta.url),'utf8');
let pool, embedded;
if (process.env.DATABASE_URL) {
  const {Pool} = await import('pg');
  pool = new Pool({connectionString:process.env.DATABASE_URL,max:30});
} else {
  const {PGlite} = await import('@electric-sql/pglite');
  embedded = new PGlite();
}
const run = async sql => embedded ? embedded.exec(sql) : (await pool.query(sql));
const rows = async sql => embedded ? (await embedded.query(sql)).rows : (await pool.query(sql)).rows;
await run("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''),'{}')::jsonb $$; grant usage on schema auth to anon, authenticated; grant execute on all functions in schema auth to anon, authenticated;");
await run(setup);
const id = n => '00000000-0000-0000-0000-' + String(n).padStart(12,'0');
for(let n=1;n<=50;n++) await run("insert into auth.users values ('"+id(n)+"')");
const day = id(100);
await run("insert into public.annex_sessions(id,title,description,starts_at,ends_at,status) values ('"+day+"','TEST ONLY','Fixture', '2099-06-01T23:00:00Z','2099-06-02T01:00:00Z','open')");
async function asUser(n, sql, role='authenticated', anonymous=false) {
  // A dedicated connection/transaction per request. In PGlite, callers are serialized explicitly.
  const conn = pool ? await pool.connect() : null;
  const exec = q => conn ? conn.query(q) : embedded.query(q);
  try {
    await exec('begin');
    await exec('set local role '+role);
    await exec("select set_config('request.jwt.claim.sub','"+(n ? id(n) : '')+"',true),set_config('request.jwt.claims','"+JSON.stringify({is_anonymous:anonymous})+"',true)");
    const result = await exec(sql);
    await exec('commit'); return result.rows;
  } catch(e) {await exec('rollback'); throw e;}
  finally {conn?.release();}
}
const book = n => asUser(n,"select public.register_annex_session('"+day+"','Test Athlete') as result");
const results = [];
if (pool) {
  results.push(...await Promise.allSettled(Array.from({length:30},(_,i)=>book(i+1))));
} else {
  for(let n=1;n<=30;n++) {try {results.push({status:'fulfilled',value:await book(n)});} catch(reason){results.push({status:'rejected',reason});}}
}
assert.equal(results.filter(r=>r.status==='fulfilled').length,18);
assert.equal(results.filter(r=>r.status==='rejected' && /SESSION_FULL/.test(r.reason.message)).length,12);
assert.equal(Number((await rows('select count(*) as count from public.annex_registrations'))[0].count),18);
const winner = results.findIndex(r=>r.status==='fulfilled')+1;
assert.deepEqual(await book(winner), results[winner-1].value);
const listed = await asUser(winner,'select * from public.list_annex_sessions()');
assert.equal(listed[0].is_registered,true);
assert.equal(Number(listed[0].registered),18);
assert.equal((await asUser(40,'select * from public.list_annex_sessions()'))[0].is_registered,false);
assert.equal((await asUser(null,'select * from public.list_annex_sessions()','anon'))[0].is_registered,false);
await assert.rejects(asUser(40,'select * from public.annex_registrations'),/permission denied/);
await assert.rejects(asUser(40,"insert into public.annex_registrations(session_id,user_id,seat,attendee_name) values ('"+day+"','"+id(40)+"',1,'spoof')"),/permission denied/);
await assert.rejects(asUser(null,"select public.register_annex_session('"+day+"','x')",'anon'),/permission denied/);
await assert.rejects(asUser(null,"select public.register_annex_session('"+day+"','x')"),/AUTH_REQUIRED/);
await assert.rejects(asUser(40,"select public.register_annex_session('"+day+"','x')",'authenticated',true),/AUTH_REQUIRED/);
await assert.rejects(run("insert into public.annex_registrations(session_id,user_id,seat,attendee_name) values ('"+day+"','"+id(40)+"',19,'x')"),/check constraint/);
await assert.rejects(run("insert into public.annex_sessions(title,starts_at,ends_at) values ('TEST','2099-06-01T22:00Z','2099-06-01T23:00Z')"),/unique constraint/);
await run("update public.annex_sessions set status='closed' where id='"+day+"'");
await assert.rejects(book(40),/SESSION_CLOSED/);
await run("update public.annex_sessions set status='open', starts_at='2020-01-01T18:00Z', ends_at='2020-01-01T20:00Z' where id='"+day+"'");
await assert.rejects(book(40),/SESSION_CLOSED/);
await assert.rejects(asUser(40,"select public.register_annex_session('"+id(999)+"','x')"),/SESSION_NOT_FOUND/);
await assert.rejects(asUser(40,"select public.register_annex_session('"+day+"',' ')"),/NAME_REQUIRED/);
console.log(pool ? 'PASS: real PostgreSQL, 30 simultaneous requests, 18 accepted, 12 rejected; retries, auth, privacy and constraints.' : 'PASS: embedded PostgreSQL SQL/security tests; 30 SERIAL requests, 18 accepted. Concurrent connections require DATABASE_URL and CI.');
await pool?.end(); await embedded?.close();
