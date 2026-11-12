
const DASHBOARD=__DASHBOARD_HTML__;
const HOST="admin.b2me-hub.app";
let jwks=null,jwksUntil=0;
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
function decode(s){s=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(s+"=".repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));}
async function authorized(req,env){
 const t=req.headers.get("Cf-Access-Jwt-Assertion");if(!t)return false;
 const p=t.split(".");if(p.length!==3)return false;
 try{
  const h=JSON.parse(new TextDecoder().decode(decode(p[0])));
  const v=JSON.parse(new TextDecoder().decode(decode(p[1])));
  const n=Math.floor(Date.now()/1000);
  if(h.alg!=="RS256"||v.exp<=n||v.nbf>n+60||v.iss!=="https://"+env.ACCESS_TEAM||!Array.isArray(v.aud)||!v.aud.includes(env.ACCESS_AUD)||String(v.email||"").toLowerCase()!==env.ADMIN_EMAIL)return false;
  if(!jwks||Date.now()>jwksUntil){const x=await fetch("https://"+env.ACCESS_TEAM+"/cdn-cgi/access/certs");if(!x.ok)return false;jwks=await x.json();jwksUntil=Date.now()+1800000;}
  const k=jwks.keys.find(x=>x.kid===h.kid);if(!k)return false;
  const cryptoKey=await crypto.subtle.importKey("jwk",k,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",cryptoKey,decode(p[2]),new TextEncoder().encode(p[0]+"."+p[1]));
 }catch{return false;}
}
const many=async(db,q,bind=[])=> (await db.prepare(q).bind(...bind).all()).results||[];
const one=(db,q,bind=[])=>db.prepare(q).bind(...bind).first();
function fail(message,status=400){const err=new Error(message);err.status=status;throw err;}
async function dashboard(db){
 const queries={
 applications:"SELECT id,full_name,email,phone,company_name,provider_type,website,job_title,status,created_at,bio,activity_ids,service_coverage,applicant_account_id,business_group FROM provider_applications ORDER BY created_at DESC LIMIT 250",
 companies:"SELECT c.id,c.owner_id,c.name_ar,c.name_en,c.provider_type,c.status,c.verified,c.public_email,c.public_phone,c.website,c.country_code,c.city,c.description_ar,c.description_en,c.created_at,a.email owner_email FROM companies c LEFT JOIN accounts a ON c.owner_id=a.id ORDER BY c.created_at DESC LIMIT 250",
 accounts:"SELECT id,first_name,last_name,email,confirmed,is_provider,phone,country_code,city,(SELECT COUNT(*) FROM companies WHERE owner_id=accounts.id) company_count FROM accounts ORDER BY rowid DESC LIMIT 250",
 listings:"SELECT l.id,l.title_ar,l.title_en,l.listing_type,l.status,l.created_at,l.company_id,c.name_ar company_name,l.indicative_price,l.currency FROM listings l LEFT JOIN companies c ON l.company_id=c.id ORDER BY l.created_at DESC LIMIT 250",
 offers:"SELECT o.id,o.title_ar,o.title_en,o.price_note,o.status,o.created_at,o.company_id,c.name_ar company_name FROM provider_offers o LEFT JOIN companies c ON o.company_id=c.id ORDER BY o.created_at DESC LIMIT 250",
 verification:"SELECT v.id,v.company_id,v.requester_id,v.status,v.provider_type,v.created_at,v.reviewed_at,c.name_ar company_name,c.verified FROM verification_requests v LEFT JOIN companies c ON v.company_id=c.id ORDER BY v.created_at DESC LIMIT 250",
 inquiries:"SELECT i.id,i.status,i.subject,i.message,i.contact_name,i.contact_email,i.contact_phone,i.created_at,i.recipient_company_id,c.name_ar company_name FROM inquiries i LEFT JOIN companies c ON i.recipient_company_id=c.id ORDER BY i.created_at DESC LIMIT 250",
 promotions:"SELECT p.id,p.kind,p.status,p.starts_at,p.ends_at,p.created_at,c.name_ar company_name FROM promotions p LEFT JOIN companies c ON p.company_id=c.id ORDER BY p.created_at DESC LIMIT 250",
 changes:"SELECT x.id,x.company_id,x.changes,x.status,x.created_at,c.name_ar company_name FROM company_change_requests x LEFT JOIN companies c ON x.company_id=c.id ORDER BY x.created_at DESC LIMIT 250",
 audit:"SELECT m.id,m.actor_id,m.entity_type,m.entity_id,m.old_status,m.new_status,m.created_at,a.email actor FROM moderation_log m LEFT JOIN accounts a ON m.actor_id=a.id ORDER BY m.id DESC LIMIT 200"
 };
 const metrics=await one(db,"SELECT (SELECT count(*) FROM accounts) users,(SELECT count(*) FROM companies) providers,(SELECT count(*) FROM companies WHERE status='approved') approvedProviders,(SELECT count(*) FROM provider_applications WHERE status='pending') pendingApplications,(SELECT count(*) FROM companies WHERE status='pending') pendingProviders,(SELECT count(*) FROM listings WHERE status='pending') pendingListings,(SELECT count(*) FROM provider_offers WHERE status='pending') pendingOffers,(SELECT count(*) FROM verification_requests WHERE status='pending') pendingVerifications,(SELECT count(*) FROM company_change_requests WHERE status='pending') pendingChanges,(SELECT count(*) FROM inquiries) inquiries,(SELECT count(*) FROM inquiries WHERE status='new') newInquiries,(SELECT count(*) FROM listings WHERE status='published') publishedListings");
 const entries=await Promise.all(Object.entries(queries).map(async([k,v])=>[k,await many(db,v)]));
 const chart=await many(db,"SELECT substr(created_at,1,10) day,count(*) total FROM provider_applications WHERE created_at>=date('now','-13 day') GROUP BY substr(created_at,1,10)");
 return {metrics,chart,data:Object.fromEntries(entries),updatedAt:new Date().toISOString()};
}
async function audit(db,actor,table,id,old,status,stmt){
 const res=await db.batch([db.prepare("INSERT INTO moderation_log(actor_id,entity_type,entity_id,old_status,new_status) VALUES(?,?,?,?,?)").bind(actor,table,id,old,status),stmt]);
 if(!res[1].meta?.changes)fail("Nothing was updated",409);
 return {ok:true};
}
const updates={companies:["approved","rejected","suspended","pending"],listings:["published","rejected","archived","pending"],provider_offers:["approved","rejected","archived","pending"],promotions:["active","paused","ended","pending"],inquiries:["new","read","contacted","closed"],verification_requests:["approved","rejected"]};
async function invitation(db,env,id,actor){
 const picked=await one(db,"SELECT * FROM provider_applications WHERE id=?",[id]);
 if(!picked)fail("Application not found",404);
 if(picked.status!=="pending")fail("This application was already reviewed",409);
 const group=picked.business_group?await many(db,"SELECT * FROM provider_applications WHERE business_group=? ORDER BY business_order",[picked.business_group]):[picked];
 const pending=group.filter(x=>x.status==="pending"),primary=group[0];
 const email=String(primary.email||"").trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail("Invalid applicant email");
 const existing=await one(db,"SELECT id,confirmed FROM accounts WHERE email=?",[email]);
 if(existing&&(!existing.confirmed||existing.id!==primary.applicant_account_id))fail("Provider email must match a verified applicant account first",409);
 const uid=existing?.id||crypto.randomUUID(),now=new Date().toISOString();
 const stmts=[existing?db.prepare("UPDATE accounts SET is_provider=1 WHERE id=?").bind(uid):db.prepare("INSERT INTO accounts(id,email,is_provider) VALUES(?,?,1)").bind(uid,email)];
 for(const item of pending){
  const title=(item.company_name||"").trim();
  stmts.push(db.prepare("INSERT INTO companies(id,owner_id,provider_type,slug,name_ar,contact_name,job_title,public_phone,public_email,website,social_links,activity_ids,logo_url,cover_url,description_ar,description_en,service_coverage) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(item.id,uid,item.provider_type||(title?"company":"freelancer"),"b2me-"+item.id,title||item.full_name,item.full_name,item.job_title,item.phone,item.email,item.website,item.social_links,item.activity_ids||"[]",item.logo_url||null,item.cover_url||null,item.bio||"",item.bio||"",item.service_coverage||null));
  stmts.push(db.prepare("UPDATE provider_applications SET status='approved',reviewed_at=?,reviewed_by=? WHERE id=? AND status='pending'").bind(now,actor,item.id));

 }
 await db.batch(stmts);
 if(!existing){
  const raw=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,"0")).join("");
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw))),b=>b.toString(16).padStart(2,"0")).join("");
  try{
   await db.prepare("INSERT INTO email_codes(digest,user_id,kind,expires) VALUES(?,?,?,?) ON CONFLICT(user_id,kind) DO UPDATE SET digest=excluded.digest,expires=excluded.expires").bind(hash,uid,"invite",Math.floor(Date.now()/1000)+3600).run();
   await env.EMAIL.send({from:{email:"accounts@b2me-hub.app",name:"B2ME hub"},to:email,subject:"Your B2ME hub provider invitation",text:"Your B2ME hub provider invitation\n\nhttps://b2me-hub.app/forgot-password.html#type=invite&b2me_code="+raw+"\n\nThis link expires in one hour."});
  }catch(e){
   const back=[];
   for(const item of pending){back.push(db.prepare("UPDATE provider_applications SET status='pending',reviewed_at=NULL,reviewed_by=NULL WHERE id=?").bind(item.id),db.prepare("DELETE FROM companies WHERE id=?").bind(item.id));}
   back.push(db.prepare("DELETE FROM accounts WHERE id=?").bind(uid));
   await db.batch(back);fail("Invitation mail could not be sent; application has not been approved.",503);
  }
 }
 await db.batch(pending.map(item=>db.prepare("INSERT INTO moderation_log(actor_id,entity_type,entity_id,old_status,new_status) VALUES(?, 'provider_applications', ?, 'pending', 'approved')").bind(actor,item.id)));
 return {ok:true,invited:!existing,companyStatus:"pending",count:pending.length};
}
async function moderate(db,env,body){
 const entity=String(body.entity||""),id=String(body.id||""),status=String(body.status||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))fail("Invalid identifier");
 const admin=await one(db,"SELECT id FROM accounts WHERE lower(email)=?",[env.ADMIN_EMAIL]);if(!admin)fail("Administrator account not provisioned",403);
 const actor=admin.id;
 if(entity==="accounts"&&status==="revoke_sessions"){
  if(id===actor)fail("You cannot revoke your own administrative sessions");
  if(!await one(db,"SELECT id FROM accounts WHERE id=?",[id]))fail("Account not found",404);
  await db.batch([db.prepare("DELETE FROM sessions WHERE user_id=?").bind(id),db.prepare("INSERT INTO moderation_log(actor_id,entity_type,entity_id,old_status,new_status) VALUES(?,'accounts',?,'sessions_active','sessions_revoked')").bind(actor,id)]);
  return {ok:true};
 }
 if(entity==="provider_applications"){
  if(status==="approved")return invitation(db,env,id,actor);
  if(status!=="rejected")fail("Invalid application decision");
  const row=await one(db,"SELECT status FROM provider_applications WHERE id=?",[id]);
  if(!row||row.status!=="pending")fail("Application already reviewed",409);
  return audit(db,actor,entity,id,row.status,status,db.prepare("UPDATE provider_applications SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status='pending'").bind(status,actor,new Date().toISOString(),id));
 }
 if(entity==="company_verification"){
  if(!["verified","unverified"].includes(status))fail("Invalid verification action");
  const row=await one(db,"SELECT verified,status FROM companies WHERE id=?",[id]);
  if(!row||row.status!=="approved")fail("Provider must be approved first",409);
  const old=row.verified?"verified":"unverified";if(old===status)fail("No change",409);
  return audit(db,actor,entity,id,old,status,db.prepare("UPDATE companies SET verified=? WHERE id=?").bind(status==="verified"?1:0,id));
 }
 if(entity==="company_change_requests"){
  if(!["approved","rejected"].includes(status))fail("Invalid decision");
  const row=await one(db,"SELECT * FROM company_change_requests WHERE id=?",[id]);
  if(!row||row.status!=="pending")fail("Request already reviewed",409);
  if(status==="approved"){
   const values=JSON.parse(row.changes||"{}");
   const allowed=["name_ar","name_en","website","logo_url","cover_url","public_email","public_phone","social_links","description_ar","description_en","job_title","city","country_code","governorate","address","activity_ids","primary_category_id","service_coverage","contact_name"];
   const fields=Object.entries(values).filter(([k])=>allowed.includes(k));
   if(fields.length)await db.prepare("UPDATE companies SET "+fields.map(([k])=>k+"=?").join(",")+" WHERE id=?").bind(...fields.map(x=>typeof x[1]==="object"?JSON.stringify(x[1]):x[1]),row.company_id).run();
  }
  return audit(db,actor,entity,id,row.status,status,db.prepare("UPDATE company_change_requests SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status='pending'").bind(status,actor,new Date().toISOString(),id));
 }
 if(!updates[entity]?.includes(status))fail("Unsupported action");
 const row=await one(db,"SELECT status FROM "+entity+" WHERE id=?",[id]);if(!row)fail("Record not found",404);if(row.status===status)fail("Already in this status",409);
 if(entity==="verification_requests"&&status==="approved"){
  const vr=await one(db,"SELECT company_id FROM verification_requests WHERE id=?",[id]);
  const company=await one(db,"SELECT status FROM companies WHERE id=?",[vr.company_id]);
  if(!company||company.status!=="approved")fail("Approve the provider before verifying documents",409);
 }
 const stmt=entity==="verification_requests"
  ?db.prepare("UPDATE verification_requests SET status=?,reviewed_at=? WHERE id=?").bind(status,new Date().toISOString(),id)
  :db.prepare("UPDATE "+entity+" SET status=? WHERE id=?").bind(status,id);
 const out=await audit(db,actor,entity,id,row.status,status,stmt);
 if(entity==="verification_requests"&&status==="approved"){
  const req=await one(db,"SELECT company_id FROM verification_requests WHERE id=?",[id]);
  const co=await one(db,"SELECT verified,status FROM companies WHERE id=?",[req.company_id]);
  if(co?.status==="approved"&&!co.verified)await audit(db,actor,"company_verification",req.company_id,"unverified","verified",db.prepare("UPDATE companies SET verified=1 WHERE id=?").bind(req.company_id));
 }
 return out;
}
export default {async fetch(req,env){
 const u=new URL(req.url);if(u.hostname!==HOST)return json({error:"Invalid hostname"},403);
 if(!await authorized(req,env))return json({error:"Administrator authorization required"},401);
 if(req.method==="GET"&&u.pathname==="/")return new Response(DASHBOARD,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'self'; img-src 'self' https://b2me-hub.app data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'","x-frame-options":"DENY","referrer-policy":"no-referrer"}});
 if(req.method==="GET"&&u.pathname==="/favicon.ico")return new Response(null,{status:204});
 if(req.method==="GET"&&u.pathname==="/api/state"){try{return json(await dashboard(env.DB));}catch(e){console.error("Admin dashboard read error",e.message);return json({error:"Dashboard data temporarily unavailable"},503);}}
 if(req.method==="POST"&&u.pathname==="/api/action"){
  if(req.headers.get("Origin")!=="https://"+HOST)return json({error:"Cross-site request denied"},403);
  if(!(req.headers.get("Content-Type")||"").includes("application/json"))return json({error:"JSON required"},415);
  try{return json(await moderate(env.DB,env,await req.json()));}catch(e){console.error("Admin action",e.status||500,e.message);return json({error:e.message||"Operation failed"},e.status||500);}
 }
 return json({error:"Not found"},404);
}};
