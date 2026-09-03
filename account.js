var accountClient=null,currentAccount=null,accountSession=null,accountInitialized=false;
const reportedOnlineMatches=new Set();

function accountConfig(){return window.CONFLUXO_SUPABASE||{}}
function accountConfigured(){let config=accountConfig();return /^https:\/\/.+\.supabase\.co$/i.test(config.url||'')&&!!config.publishableKey}
function normalizeAccountName(value){return String(value||'').trim().replace(/\s+/g,' ').slice(0,18)}
function accountNameKey(value){return normalizeAccountName(value).toLowerCase().replace(/[^a-z0-9]/g,'')}
function validAccountName(value){return /^[A-Za-z0-9 ]{3,18}$/.test(normalizeAccountName(value))&&accountNameKey(value).length>=3}
function accountPublicSnapshot(){return currentAccount?{id:currentAccount.id,username:currentAccount.username,wins:Number(currentAccount.wins)||0,losses:Number(currentAccount.losses)||0}:null}
function safeAccountSnapshot(value){if(!value||typeof value!=='object'||!value.id)return null;return{id:String(value.id),username:normalizeAccountName(value.username)||'Duelista',wins:Math.max(0,Number(value.wins)||0),losses:Math.max(0,Number(value.losses)||0)}}
function accountRecordText(account){return account?`${account.wins||0} VITÓRIAS · ${account.losses||0} DERROTAS`:'CONVIDADO · PARTIDAS NÃO CONTABILIZADAS'}
async function lookupAccountProfile(value){let candidate=safeAccountSnapshot(value);if(!candidate||!accountClient)return candidate;let {data,error}=await accountClient.from('profiles').select('id,username,wins,losses').eq('id',candidate.id).single();return error?null:safeAccountSnapshot(data)}
function setAccountMessage(text,kind=''){let el=document.querySelector('#account-message');if(!el)return;el.textContent=text;el.className=`account-message ${kind}`}
function setAccountBusy(busy){document.querySelectorAll('#account-dialog input,#account-dialog button').forEach(el=>{if(!el.classList.contains('dialog-close'))el.disabled=busy})}

function updateAccountUI(){
 let snapshot=accountPublicSnapshot(),card=document.querySelector('#account-card'),name=document.querySelector('#account-name'),record=document.querySelector('#account-record'),button=document.querySelector('#account-open'),logout=document.querySelector('#account-logout'),onlineName=document.querySelector('#online-name');
 if(card)card.classList.toggle('signed-in',!!snapshot);if(name)name.textContent=snapshot?snapshot.username:'Jogar como convidado';if(record)record.textContent=accountRecordText(snapshot);if(button)button.textContent=snapshot?'VER CONTA':'ENTRAR OU CRIAR CONTA';if(logout)logout.classList.toggle('hidden',!snapshot);
 if(onlineName){if(snapshot){onlineName.value=snapshot.username;onlineName.readOnly=true;onlineName.title='O nome online está vinculado à sua conta.'}else{onlineName.readOnly=false;onlineName.title='';let saved=localStorage.getItem('confluxo-guest-name');if(!onlineName.value&&saved)onlineName.value=saved}}
 if(typeof onlineMode!=='undefined'&&onlineMode&&localPlayer&&typeof onlineAccounts!=='undefined'){onlineAccounts[localPlayer]=snapshot;if(snapshot)onlineNames[localPlayer]=snapshot.username;if(typeof sendDeckChoice==='function'&&dataChannel?.open)sendDeckChoice()}
}
async function loadCurrentProfile(){
 if(!accountClient)return null;let {data:{session}}=await accountClient.auth.getSession();accountSession=session||null;if(!session){currentAccount=null;updateAccountUI();return null}
 let {data,error}=await accountClient.from('profiles').select('id,username,wins,losses').eq('id',session.user.id).single();if(error){currentAccount=null;setAccountMessage('A conta existe, mas o perfil ainda não foi preparado no banco.','error');updateAccountUI();return null}currentAccount=safeAccountSnapshot(data);updateAccountUI();return currentAccount
}
async function initializeAccounts(){
 if(accountInitialized)return;accountInitialized=true;updateAccountUI();
 if(!accountConfigured()){setAccountMessage('Contas globais aguardando a conexão com o banco. O modo convidado continua disponível.','notice');return}
 if(!window.supabase?.createClient){setAccountMessage('Não foi possível carregar o serviço de contas. Tente recarregar a página.','error');return}
 let config=accountConfig();accountClient=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});await loadCurrentProfile();accountClient.auth.onAuthStateChange(()=>setTimeout(loadCurrentProfile,0))
}
function openAccountDialog(){let dialog=document.querySelector('#account-dialog');if(!dialog)return;if(currentAccount){document.querySelector('#account-dialog-title').textContent=currentAccount.username;setAccountMessage(accountRecordText(currentAccount),'success');document.querySelector('#account-fields').classList.add('hidden')}else{document.querySelector('#account-dialog-title').textContent='Sua conta Confluxo';document.querySelector('#account-fields').classList.remove('hidden');setAccountMessage(accountConfigured()?'Entre ou crie um nome único para seus duelos online.':'O banco de contas ainda não foi conectado.','notice')}dialog.showModal()}
async function submitAccount(mode){
 if(!accountClient)return setAccountMessage('O serviço de contas ainda não está configurado.','error');let username=normalizeAccountName(document.querySelector('#account-username').value),email=document.querySelector('#account-email').value.trim(),password=document.querySelector('#account-password').value;
 if(mode==='signup'&&!validAccountName(username))return setAccountMessage('Use de 3 a 18 letras, números ou espaços no nome.','error');if(!email||password.length<6)return setAccountMessage('Informe o e-mail e uma senha com pelo menos 6 caracteres.','error');setAccountBusy(true);setAccountMessage(mode==='signup'?'Criando conta…':'Entrando…','notice');
 try{let result=mode==='signup'?await accountClient.auth.signUp({email,password,options:{data:{username}}}):await accountClient.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(mode==='signup'&&!result.data.session){setAccountMessage('Conta criada. Confirme o e-mail e depois entre.','success')}else{await loadCurrentProfile();setAccountMessage(currentAccount?`Bem-vindo, ${currentAccount.username}.`:'Conta autenticada; preparando perfil…','success')}}catch(error){let message=String(error?.message||error);if(/duplicate|unique|database error/i.test(message))message='Esse nome já está em uso. Escolha outro.';else if(/invalid login/i.test(message))message='E-mail ou senha incorretos.';setAccountMessage(message,'error')}finally{setAccountBusy(false)}
}
async function logoutAccount(){if(!accountClient)return;await accountClient.auth.signOut();currentAccount=null;accountSession=null;document.querySelector('#account-fields')?.classList.remove('hidden');updateAccountUI();setAccountMessage('Você saiu da conta.','notice')}
async function refreshOnlineAccounts(){await loadCurrentProfile();if(typeof onlineAccounts!=='undefined'&&localPlayer)onlineAccounts[localPlayer]=accountPublicSnapshot();if(state?.players&&localPlayer&&currentAccount)state.players[localPlayer].account=accountPublicSnapshot();if(typeof render==='function'&&state)render()}
async function reportOnlineMatchResult(winner,reason){
 if(!accountClient||!currentAccount||!onlineMode||onlineRole==='spectator'||!state?.matchId||!localPlayer)return false;let mine=safeAccountSnapshot(state.players?.[localPlayer]?.account),otherNumber=localPlayer===1?2:1,other=safeAccountSnapshot(state.players?.[otherNumber]?.account);if(!mine||!other||mine.id!==currentAccount.id||mine.id===other.id)return false;let matchKey=`${state.matchId}:${currentAccount.id}`;if(reportedOnlineMatches.has(matchKey))return false;reportedOnlineMatches.add(matchKey);
 let {data,error}=await accountClient.rpc('report_match_result',{p_match_id:state.matchId,p_opponent:other.id,p_winner:state.players[winner]?.account?.id||null,p_reason:reason||'duelo'});if(error){reportedOnlineMatches.delete(matchKey);console.warn('Resultado online não contabilizado:',error.message);return false}if(data){await refreshOnlineAccounts();if(typeof hint==='function')hint('Resultado confirmado pelos dois jogadores e salvo no perfil.')}else{setTimeout(refreshOnlineAccounts,1800);setTimeout(refreshOnlineAccounts,4500)}return !!data
}

document.addEventListener('DOMContentLoaded',()=>{
 initializeAccounts();let onlineName=document.querySelector('#online-name');onlineName?.addEventListener('input',()=>{if(!currentAccount)localStorage.setItem('confluxo-guest-name',normalizeAccountName(onlineName.value))});document.querySelector('#account-open').onclick=openAccountDialog;document.querySelector('#account-logout').onclick=logoutAccount;document.querySelector('#account-login').onclick=()=>submitAccount('login');document.querySelector('#account-signup').onclick=()=>submitAccount('signup');document.querySelector('#account-dialog .dialog-close').onclick=()=>document.querySelector('#account-dialog').close()
});
