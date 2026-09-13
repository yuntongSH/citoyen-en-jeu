import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s=>s.trim()).filter(Boolean);
  const cors = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  if(!allowed.includes(origin)) return new Response('Forbidden',{status:403});
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
  const reply=(body:object,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(request.method!=='POST') return reply({error:'Method not allowed'},405);
  const authorization=request.headers.get('authorization') || '';
  if(!authorization.startsWith('Bearer ')) return reply({error:'Unauthorized'},401);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await admin.auth.getUser(authorization.slice(7));
  if(error || !user) return reply({error:'Unauthorized'},401);
  const body=await request.json().catch(()=>null);
  if(body?.confirm!==true || Object.keys(body).some(k=>k!=='confirm')) return reply({error:'Explicit confirmation required'},400);
  const result=await admin.auth.admin.deleteUser(user.id);
  if(result.error) return reply({error:'Deletion failed'},500);
  return reply({deleted:true});
});
