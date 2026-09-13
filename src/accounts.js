import { createClient } from '@supabase/supabase-js';

const config = window.CITOYEN_CONFIG || {};
const app = window.CitoyenLearning;
const progress = window.CitoyenProgress;
const modal = document.querySelector('#account-dialog');
const trigger = document.querySelector('#account-button');
const lessonDialog = document.querySelector('#lesson-dialog');
const signupPromptKey = 'citoyen-signup-prompt-v1';
let signupPromptSeen = false, pendingGuestImport = null;
try { signupPromptSeen = localStorage.getItem(signupPromptKey) === '1'; } catch {}
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enabled = config.accountsEnabled === true && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || '') && config.supabasePublishableKey?.startsWith('sb_publishable_') && config.privacyContact;
const client = enabled ? createClient(config.supabaseUrl, config.supabasePublishableKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'citoyen-auth-v1'}}) : null;
let user = null, epoch = 0, ready = false, dirty = false, running = false, timer, pendingEmail = '', lastSent = 0;
let status = enabled ? 'Vérification du compte…' : 'Progression sur cet appareil';

function showStatus(text) { status = text; app.setSyncStatus(text); }
function message(text) { const el=modal.querySelector('[role="status"]'); if(el) el.textContent=text; }
function later() {clearTimeout(timer); timer=setTimeout(sync,700);}
function showSignupPrompt() {
  const completion = lessonDialog.querySelector('.completion');
  if (!enabled || !ready || user || signupPromptSeen || !lessonDialog.open || modal.open || !completion) return;
  signupPromptSeen = true;
  try { localStorage.setItem(signupPromptKey, '1'); } catch {}
  const prompt = document.createElement('section');
  prompt.className = 'signup-prompt';
  prompt.setAttribute('aria-labelledby', 'signup-prompt-title');
  prompt.tabIndex = -1;
  prompt.innerHTML = '<h3 id="signup-prompt-title">Sauvegardez votre progression gratuitement</h3><p>Votre première leçon est terminée ! Retrouvez votre progression sur tous vos appareils avec un compte e-mail.</p><div class="signup-prompt-actions"><button class="primary solid" data-signup="create">Créer mon compte</button><button class="secondary" data-signup="skip">Continuer sans compte</button></div>';
  prompt.addEventListener('click', e => {
    const action = e.target.closest('[data-signup]')?.dataset.signup;
    if (!action) return;
    prompt.remove();
    if (action === 'skip') { completion.querySelector('button')?.click(); return; }
    // This explicit save action authorizes importing this guest progress after sign-in.
    pendingGuestImport = app.snapshot();
    lessonDialog.close();
    modal.showModal();
    draw();
    modal.querySelector('#login-email')?.focus();
  });
  completion.after(prompt);
  prompt.focus({preventScroll:true});
  prompt.scrollIntoView({block:'nearest', behavior:'instant'});
}
window.addEventListener('citoyen:first-lesson-completed', showSignupPrompt);
modal.addEventListener('close', () => { pendingGuestImport = null; });
function fail(error) {
  if (error?.status===429 || /rate|too many/i.test(error?.message || '')) return 'Trop de demandes. Patientez quelques minutes avant de réessayer.';
  if (!navigator.onLine || /fetch|network/i.test(error?.message || '')) return 'Connexion indisponible. Réessayez quand vous serez en ligne.';
  return 'La demande n’a pas abouti. Réessayez ou contactez le responsable du site.';
}
function draw() {
  trigger.textContent=user?'Mon compte':'Se connecter';
  if (!modal.open) return;
  modal.innerHTML=`<button class="close" aria-label="Fermer le compte" data-action="close">×</button><span class="eyebrow">VOTRE PARCOURS, À RETROUVER</span><h2 id="account-title">${user?'Votre compte':'Reprenez là où vous en étiez.'}</h2>`;
  if(!enabled) {
    modal.insertAdjacentHTML('beforeend',`<p>Les comptes seront disponibles après l’ouverture du service de connexion. Pour le moment, vous pouvez apprendre librement et votre progression reste dans ce navigateur.</p><a class="secondary" href="${escape(config.repository)}" target="_blank" rel="noopener">Suivre le projet sur GitHub ↗</a>`);
  } else if (user) {
    const guest=app.getGuest();
    modal.insertAdjacentHTML('beforeend',`<p class="account-email">${escape(user.email)}</p><p class="account-sync">${escape(status)}</p><p>Leçons terminées, cartes, résultat et dernière leçon sont retrouvés sur vos appareils après connexion.</p><div class="account-actions"><button class="primary solid" data-action="resume">Reprendre ma dernière leçon →</button><button class="secondary" data-action="sync">Synchroniser maintenant</button>${guest.done.length||guest.known.length||guest.review.length?'<button class="secondary" data-action="import">Ajouter ma progression sans compte</button>':''}<button class="secondary" data-action="export">Télécharger mes données</button><button class="secondary" data-action="signout">Me déconnecter de cet appareil</button><button class="text-button danger" data-action="delete">Supprimer mon compte</button></div><p class="account-note">Sur un appareil partagé, déconnectez-vous après votre visite. La progression de votre compte est retirée de ce navigateur à la déconnexion.</p>`);
  } else {
    modal.insertAdjacentHTML('beforeend',`<p>Un code par e-mail suffit. Votre progression est privée et vous pourrez la retrouver sur un autre appareil.</p><form id="email-form"><label for="login-email">Votre adresse e-mail</label><input id="login-email" name="email" type="email" autocomplete="email" required maxlength="254" value="${escape(pendingEmail)}"><button class="primary solid" type="submit">Recevoir mon code →</button></form>${pendingEmail?`<form id="code-form"><label for="login-code">Le code reçu par e-mail</label><input id="login-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" required><button class="primary solid" type="submit">Me connecter</button></form>`:''}<p class="account-note">Si cette adresse n’a pas encore de compte, il sera créé après vérification. Elle sert à la connexion et au suivi du compte, sans inscription à une newsletter.</p>`);
  }
  if (!user && pendingGuestImport) modal.querySelector('#email-form')?.insertAdjacentHTML('beforebegin', '<p class="account-note">Après connexion, cette première leçon sera ajoutée à votre compte.</p>');
  modal.insertAdjacentHTML('beforeend','<p role="status" class="account-message" aria-live="polite"></p><a class="source-link" href="privacy.html">Confidentialité et données personnelles ↗</a>');
}
trigger.addEventListener('click',()=>{modal.showModal();draw();});
modal.addEventListener('click',async e=>{
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='close') return modal.close();
  if(action==='resume') {modal.close();app.resume();return;}
  if(action==='sync') {await sync();message(status);return;}
  if(action==='import' && user && ready) {app.importGuest();dirty=true;await sync();draw();message('Progression ajoutée au compte.');return;}
  if(action==='export' && user) {
    const blob=new Blob([JSON.stringify({email:user.email,progress:app.snapshot()},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='citoyen-mes-donnees.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if(action==='signout' && user) {
    await sync();
    if(dirty) {message('La synchronisation a échoué. Téléchargez vos données avant de vous déconnecter, puis réessayez.');return;}
    const result=await client.auth.signOut({scope:'local'});
    if(result.error) message(fail(result.error));
    return;
  }
  if(action==='delete' && user) {
    modal.innerHTML=`<button class="close" aria-label="Annuler" data-action="close">×</button><h2 id="account-title">Supprimer votre compte ?</h2><p>Votre compte et toute votre progression enregistrée seront supprimés. Cette action est définitive.</p><button class="secondary" data-action="back">Conserver mon compte</button><button class="primary solid danger" data-action="confirm-delete">Supprimer définitivement</button><p role="status" aria-live="polite"></p>`;return;
  }
  if(action==='back') return draw();
  if(action==='confirm-delete' && user) {
    const button=e.target.closest('button');button.disabled=true;
    const {error}=await client.functions.invoke('delete-account',{body:{confirm:true}});
    if(error) {button.disabled=false;message('Suppression impossible pour le moment. Contactez '+config.privacyContact+'.');return;}
    await client.auth.signOut({scope:'local'});await changeUser(null);draw();message('Votre compte a été supprimé.');
  }
});
modal.addEventListener('submit',async e=>{
  e.preventDefault();if(!client)return;
  const button=e.target.querySelector('button[type="submit"]');button.disabled=true;
  try {
    if(e.target.id==='email-form') {
      if(Date.now()-lastSent<60000) {message('Patientez une minute avant de demander un nouveau code.');return;}
      const email=new FormData(e.target).get('email').trim();
      const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
      if(error) {message(fail(error));return;}
      pendingEmail=email;lastSent=Date.now();draw();message('Si la demande est acceptée, un code arrive dans votre boîte e-mail. Vérifiez aussi les courriers indésirables.');modal.querySelector('#login-code')?.focus();
    } else if(e.target.id==='code-form') {
      const token=new FormData(e.target).get('code').trim();
      const {error}=await client.auth.verifyOtp({email:pendingEmail,token,type:'email'});
      if(error) {message('Code invalide ou expiré. Vérifiez-le ou demandez un nouveau code.');return;}
      pendingEmail='';message('Connexion réussie. Votre progression se charge…');
    }
  } catch(error) {message(fail(error));} finally {button.disabled=false;}
});

async function changeUser(next) {
  if(user?.id===next?.id && ready) return;
  const turn=++epoch;ready=false;dirty=false;clearTimeout(timer);
  const prior=user?.id;user=next;
  app.switchAccount(next?.id || null, prior);
  draw();
  if(!next) {ready=true;showStatus('Progression sur cet appareil');return;}
  showStatus('Chargement de votre progression…');
  try {
    const {data,error}=await client.from('learning_progress').select('payload, revision').eq('user_id',next.id).maybeSingle();
    if(turn!==epoch) return;
    if(error) throw error;
    const merged = progress.merge(data?.payload,app.snapshot(),app.validIds);
    app.replace(pendingGuestImport ? progress.merge(merged,pendingGuestImport,app.validIds) : merged);
    pendingGuestImport = null;
    ready=true;dirty=true;await sync();draw();
  } catch {if(turn===epoch) {showStatus('Compte connecté · synchronisation indisponible');draw();}}
}
async function sync() {
  if(!user) return;
  if(!ready) {await changeUser(user);return;}
  if(running) {dirty=true;return;}
  const turn=epoch, id=user.id;running=true;
  try {
    do {
      dirty=false;showStatus('Enregistrement en cours…');
      let saved=false;
      for(let attempt=0;attempt<4;attempt++) {
        const {data:remote,error:readError}=await client.from('learning_progress').select('payload, revision').eq('user_id',id).maybeSingle();
        if(turn!==epoch) return;
        if(readError) throw readError;
        const local=app.snapshot(), merged=progress.merge(remote?.payload,local,app.validIds);
        const {error}=await client.rpc('save_learning_progress',{expected_revision:remote?.revision||0,new_payload:merged});
        if(turn!==epoch) return;
        if(error?.code==='40001') continue;
        if(error) throw error;
        app.replace(progress.merge(merged,app.snapshot(),app.validIds));
        saved=true;break;
      }
      if(!saved) throw new Error('Concurrent update');
    } while(dirty && turn===epoch);
    if(turn===epoch) showStatus('Progression synchronisée avec votre compte');
  } catch {if(turn===epoch) {dirty=true;showStatus('Enregistré ici · synchronisation à réessayer');}}
  finally {running=false;}
}
window.addEventListener('citoyen:progress',()=>{if(user){dirty=true;if(ready)later();}});
window.addEventListener('online',()=>{if(user)sync();});
document.addEventListener('visibilitychange',()=>{if(user && document.visibilityState==='visible')sync();});
window.addEventListener('pagehide',()=>{if(dirty)sync();});
window.addEventListener('beforeunload',e=>{if(user && dirty){e.preventDefault();e.returnValue='';}});
if(client) {
  client.auth.onAuthStateChange((event,session)=>{
    // Do not await other Supabase calls inside the auth callback.
    if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) setTimeout(()=>changeUser(session?.user||null),0);
  });
  setInterval(()=>{if(user && document.visibilityState==='visible')sync();},30000);
} else {ready=true;showStatus(status);}
