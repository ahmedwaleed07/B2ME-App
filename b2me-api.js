/* B2ME browser-safe Supabase REST/Auth client. No service-role keys. */
(function(global){
  "use strict";
  const BASE="https://wlamwvhrcezhpbudfzhp.supabase.co";
  const KEY="sb_publishable_BZwoD19dvThmSawDRSutIA_arliTbQU";
  const STORAGE="b2me_auth_session_v1";
  const sessions=[localStorage,sessionStorage];
  let session=null, persistent=false, refreshing=null;
  function normalizeSession(s){
    if(s?.access_token&&s?.refresh_token){
      if(!s.expires_at&&s.expires_in)s.expires_at=Math.floor(Date.now()/1000)+Number(s.expires_in);
    }
    return s;
  }
  function fromStore(){
    for(let i=0;i<sessions.length;i++){
      try{const s=JSON.parse(sessions[i].getItem(STORAGE)||"null");
        if(s&&s.access_token&&s.refresh_token){session=normalizeSession(s);persistent=i===0;return session;}
      }catch(_){}
    }
    session=null;return null;
  }
  function saveSession(s,remember){
    session=normalizeSession(s)||null;persistent=!!remember;
    for(const store of sessions){try{store.removeItem(STORAGE);}catch(_){}}
    if(session){try{(persistent?localStorage:sessionStorage).setItem(STORAGE,JSON.stringify(session));}catch(_){}}
  }
  function fail(body,status){
    const e=new Error(body?.msg||body?.error_description||body?.message||body?.error||"Request failed");
    e.status=status||0;throw e;
  }
  async function request(path,{method="GET",body,auth=false,headers={},signal,retried=false}={}){
    const h={apikey:KEY,...headers};
    if(body!==undefined)h["Content-Type"]="application/json";
    if(auth){const s=await currentSession();if(!s)throw new Error("Please sign in first");
      h.Authorization="Bearer "+s.access_token;}
    const res=await fetch(BASE+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),signal});
    const content=await res.text();
    let data;try{data=content?JSON.parse(content):null;}catch(_){data={message:content.slice(0,200)};}
    if(res.status===401&&auth&&!retried){
      const renewed=await refresh();
      if(renewed)return request(path,{method,body,auth,headers,signal,retried:true});
    }
    if(!res.ok)fail(data,res.status);
    return data;
  }
  async function refresh(){
    if(refreshing)return refreshing;
    if(!session?.refresh_token)return null;
    refreshing=(async()=>{
      try{
        const s=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:session.refresh_token}});
        saveSession(s,persistent);return s;
      }catch(e){saveSession(null,false);return null;}
      finally{refreshing=null;}
    })();
    return refreshing;
  }
  async function currentSession(){
    // Re-read shared storage to pick up sign-outs and rotated refresh tokens from other tabs.
    if(persistent||!session)fromStore();
    if(!session)return null;
    if(session.expires_at&&Date.now()/1000>session.expires_at-60)return refresh();
    return session;
  }
  async function signIn(email,password,remember){
    const s=await request("/auth/v1/token?grant_type=password",{method:"POST",body:{email,password}});
    if(!s?.access_token||!s?.user)throw new Error("Could not start an authenticated session");
    saveSession(s,remember);return s;
  }
  async function signUp(email,password,remember,metadata){
    const redirect=global.location.origin+global.location.pathname;
    const payload={email,password};
    if(metadata!==undefined)payload.data=metadata;
    const result=await request("/auth/v1/signup?redirect_to="+encodeURIComponent(redirect),{method:"POST",body:payload});
    if(result?.access_token&&result?.user)saveSession(result,remember);
    return result;
  }
  async function submitProviderApplication(application){
    // The anonymous role can insert only the form fields; it cannot read or review rows.
    return request("/rest/v1/provider_applications",{
      method:"POST",body:application,headers:{Prefer:"return=minimal"}
  }
    });
  async function invokeFunction(name,payload){
    if(!/^[a-z0-9-]+$/i.test(name))throw new Error("Invalid function name");
    return request("/functions/v1/"+encodeURIComponent(name),{
      method:"POST",body:payload,auth:true
    });
  }
  async function sendPasswordReset(email){
    const redirect=global.location.origin+global.location.pathname;
    return request("/auth/v1/recover?redirect_to="+encodeURIComponent(redirect),{
      method:"POST",body:{email}
    });
  }
  async function consumeEmailLink(){
    const fragment=global.location.hash?.replace(/^#/,"")||"";
    const args=new URLSearchParams(fragment);
    const type=args.get("type")||"";
    const err=args.get("error_description")||args.get("error");
    if(err){
      if(typeof global.history?.replaceState==="function")
        global.history.replaceState(null,"",global.location.pathname+global.location.search);
      return {type:"error",error:err};
    }
    const access_token=args.get("access_token"),refresh_token=args.get("refresh_token");
    if(!access_token||!refresh_token)return {type:""};
    const s={access_token,refresh_token,token_type:args.get("token_type")||"bearer",
      expires_at:Math.floor(Date.now()/1000)+Number(args.get("expires_in")||3600)};
    const priorPersistent=!!persistent;
    saveSession(s,priorPersistent);
    try{
      const user=await request("/auth/v1/user",{auth:true});
      if(!user?.id)throw new Error("Unable to verify email session");
      s.user=user;saveSession(s,priorPersistent);
    }catch(e){saveSession(null,false);throw e;}
    if(typeof global.history?.replaceState==="function")
      global.history.replaceState(null,"",global.location.pathname+global.location.search);
    return {type,session:s};
  }
  async function updatePassword(password){
    if(typeof password!=="string"||password.length<8)
      throw new Error("Use at least 8 characters for your new password");
    return request("/auth/v1/user",{method:"PUT",body:{password},auth:true});
  }
  async function signOut(){
    const s=await currentSession();
    try{if(s)await request("/auth/v1/logout",{method:"POST",headers:{Authorization:"Bearer "+s.access_token}});}
    finally{saveSession(null,false);}
  }
  function params(query={}){
    const p=new URLSearchParams();
    for(const [k,v] of Object.entries(query)){if(v!==undefined&&v!==null)p.set(k,String(v));}
    return p.toString();
  }
  async function list(table,query={},auth=false){
    const qp=params({select:"*",...query});
    return request("/rest/v1/"+encodeURIComponent(table)+"?"+qp,{auth});
  }
  async function insert(table,data){
    const res=await request("/rest/v1/"+encodeURIComponent(table),{
      method:"POST",body:data,auth:true,headers:{Prefer:"return=representation"}
    });
    return Array.isArray(res)?res[0]:res;
  }
  async function update(table,data,query){
    const res=await request("/rest/v1/"+encodeURIComponent(table)+"?"+params(query),{
      method:"PATCH",body:data,auth:true,headers:{Prefer:"return=representation"}
    });
    return res;
  }
  async function remove(table,query){
    return request("/rest/v1/"+encodeURIComponent(table)+"?"+params(query),{
      method:"DELETE",auth:true
    });
  }
  async function rpc(name,args){
    if(name!=="b2me_moderate")throw new Error("Unsupported RPC method");
    return request("/rest/v1/rpc/"+encodeURIComponent(name),{
      method:"POST",body:args,auth:true,headers:{Prefer:"return=representation"}
    });
  }
  async function uploadImage(file){
    const s=await currentSession();if(!s)throw new Error("Sign in to upload photos");
    const supported=["image/jpeg","image/png","image/webp"];
    if(!supported.includes(file.type))throw new Error("Only JPEG, PNG, WebP images are allowed");
    if(file.size>5*1024*1024)throw new Error("Image must be 5 MB or smaller");
    const ext=file.type.split("/")[1]==="jpeg"?"jpg":file.type.split("/")[1];
    const id=global.crypto?.randomUUID?global.crypto.randomUUID():Date.now().toString(36);
    const filename=s.user.id+"/"+id+"."+ext;
    const resp=await fetch(BASE+"/storage/v1/object/b2me-public-images/"+filename,{
      method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+s.access_token,
      "Content-Type":file.type,"x-upsert":"false"},body:file
    });
    if(!resp.ok){let err;try{err=await resp.json()}catch(_){err={}}fail(err,resp.status);}
    return BASE+"/storage/v1/object/public/b2me-public-images/"+filename;
  }
  // Never trust the old browser-only fake session.
  try{localStorage.removeItem("b2me_session");}catch(_){}
  fromStore();
  if(typeof global.addEventListener==="function"){
    global.addEventListener("storage",ev=>{
      if(ev.key===STORAGE||ev.key===null)fromStore();
    });
  }
  global.B2ME_API={url:BASE,currentSession,signIn,signUp,signOut,
    sendPasswordReset,consumeEmailLink,updatePassword,submitProviderApplication,
    list,insert,update,remove,rpc,uploadImage,invokeFunction,
    isLoggedIn:()=>!!session?.user,user:()=>session?.user||null,params};
})(window);
