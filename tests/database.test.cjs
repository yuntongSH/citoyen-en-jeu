const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('database rejects anonymous access, isolates users, rejects stale writes and cascades deletion',async()=>{
  const db=new PGlite();
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; insert into auth.users values('${a}'),('${b}');`);
    await db.exec(fs.readFileSync('supabase/migrations/202609130001_learning_progress.sql','utf8'));
    await db.exec(`set role anon`);
    await assert.rejects(db.query('select * from public.learning_progress'),/permission denied/);
    await assert.rejects(db.query("select public.save_learning_progress(0,'{}')"),/permission denied/);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${a}',false)`);
    await db.query('select public.save_learning_progress($1,$2)',[0,JSON.stringify({done:['devise']})]);
    await assert.rejects(db.query('select public.save_learning_progress($1,$2)',[0,'{}']),/Progress changed/);
    await assert.rejects(db.query('insert into public.learning_progress(user_id) values($1)',[b]),/permission denied/);
    assert.equal((await db.query('select * from public.learning_progress')).rows.length,1);
    await db.exec(`select set_config('request.jwt.claim.sub','${b}',false)`);
    assert.equal((await db.query('select * from public.learning_progress')).rows.length,0);
    await db.query('select public.save_learning_progress($1,$2)',[0,JSON.stringify({done:['egalite']})]);
    assert.equal((await db.query('select * from public.learning_progress')).rows[0].user_id,b);
    await db.exec(`reset role; delete from auth.users where id='${a}'`);
    assert.equal((await db.query('select * from public.learning_progress')).rows.length,1);
  } finally {await db.close();}
});
