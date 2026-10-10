/* Live B2ME mobile app integration. Visuals and original brand images stay untouched. */
(function(){
"use strict";
const api=window.B2ME_API;
if(!api){console.error("B2ME API client missing");return;}
langStrings.ar.guestNote="البيانات المعروضة مباشرة من B2ME. تظهر الشركات بعد موافقة الإدارة.";
langStrings.en.guestNote="Live B2ME data. Providers appear after administrative approval.";
langStrings.ar.demoStatus="متصل بقاعدة بيانات B2ME";
langStrings.en.demoStatus="Connected to B2ME database";
langStrings.ar.authError="تأكد من الإيميل وكلمة المرور (8 أحرف على الأقل).";
langStrings.en.authError="Enter a valid email and password (at least 8 characters).";
langStrings.ar.notificationNote="إشعاراتك الحقيقية من B2ME";
langStrings.en.notificationNote="Your actual B2ME notifications";
let activeUser=null,liveNotices=[],liveOfferings=[],catalogReady=false;
let started=false;
const msg=(ar,en)=>language==="ar"?ar:en;
const report=e=>{console.error("B2ME",e);toast(msg("حدث خطأ: ","Error: ")+(e?.message||String(e)));};
const asText=x=>String(x??"");
const sanitizedUrl=x=>/^https?:\/\//i.test(asText(x))?asText(x):"";
const fromRow=(r,listings=[])=>({
 id:r.id,ar:r.name_ar,en:r.name_en||r.name_ar,
 sector:categoriesData.find(c=>c.dbId===r.primary_category_id)?.id||"tech",
 cityAr:r.city||r.governorate||"العراق",cityEn:r.city||r.governorate||"Iraq",
 bioAr:r.description_ar||"",bioEn:r.description_en||r.description_ar||"",
 logo:r.name_ar?.slice(0,2)||"B2",dashboardLogo:sanitizedUrl(r.logo_url),
 dashboardCover:sanitizedUrl(r.cover_url),cover:"",email:r.public_email||"",
 phone:r.public_phone||"",site:sanitizedUrl(r.website),social:"",
 servicesAr:listings.filter(l=>l.company_id===r.id).map(l=>l.title_ar),
 servicesEn:listings.filter(l=>l.company_id===r.id).map(l=>l.title_en||l.title_ar),
 recent:true
});
function liveRender(){
 render();
 const badge=el("demoBadge");if(badge)badge.textContent=msg("العراق • بيانات حقيقية","Iraq • Live data");
 const subtitle=el("demoSubtitle");if(subtitle)subtitle.textContent=
  msg("B2ME • قاعدة بيانات متصلة","B2ME • Connected database");
}
async function loadCatalog(){
 try{
  const [cats,rows,listings,approvedOffers]=await Promise.all([
   api.list("categories",{is_active:"eq.true",order:"sort_order.asc"}),
   api.list("companies",{status:"eq.approved",order:"created_at.desc",limit:100}),
   api.list("listings",{status:"eq.published",limit:200}),
   api.list("provider_offers",{status:"eq.approved",requested_enabled:"eq.true",limit:100})
  ]);
  const icons={tech:"code",ads:"campaign",office:"chair",delivery:"delivery",catering:"food",
    security:"shield",design:"camera",consult:"briefcase",supplies:"box"};
  const palettes=[["#9f29c7","#f5eafa"],["#ec3583","#feecf5"],["#2967cc","#edf3ff"],
   ["#de713a","#fff1e7"],["#32a58e","#e9fbf4"]];
  categoriesData.splice(0,categoriesData.length,...cats.map((c,i)=>({
   id:c.slug,dbId:c.id,ar:c.name_ar,en:c.name_en,
   icon:icons[c.slug]||"box",color:palettes[i%palettes.length][0],
   bg:palettes[i%palettes.length][1]
  })));
  liveOfferings=listings;
  companies.splice(0,companies.length,...rows.map(r=>fromRow(r,listings)));
  const byId=new Map(rows.map(r=>[r.id,r]));
  offers.splice(0,offers.length,...approvedOffers.filter(o=>byId.has(o.company_id)).map(o=>{
   const c=byId.get(o.company_id);
   return {cid:o.company_id,ar:o.title_ar,en:o.title_en||o.title_ar,
    brandAr:c.name_ar,brandEn:c.name_en||c.name_ar};
  }));
  if(!companies.some(c=>c.id===selectedCompany))selectedCompany=companies[0]?.id||"";
  catalogReady=true;
  liveRender();
 }catch(e){catalogReady=false;companies.splice(0);offers.splice(0);categoriesData.splice(0);liveRender();report(e);}
}
async function loadPersonal(){
 if(!activeUser){favorites=[];liveNotices=[];return;}
 try{
  const [fav,notes]=await Promise.all([
   api.list("company_favorites",{user_id:"eq."+activeUser.id,select:"company_id"},true),
   api.list("notifications",{user_id:"eq."+activeUser.id,order:"created_at.desc",limit:30},true)
  ]);
  favorites=fav.map(x=>x.company_id);liveNotices=notes;
  liveRender();
 }catch(e){report(e);}
}
function requireAuth(){
 if(activeUser)return true;
 toast(msg("سجّل دخولك أولاً لإكمال العملية.","Please sign in to continue."));
 authMode="signin";go("auth");return false;
}
// Do not import the old fake browser-only state into the real app.
try{localStorage.removeItem("b2me_favorites");localStorage.removeItem("b2me_demo_request");}catch(_){}
syncDashboardDemo=function(){};
renderAuth=(function(old){return function(){
 old();
 const box=el("auth").querySelector(".authCard");
 if(box&&!box.querySelector("#b2meGuest"))box.insertAdjacentHTML("afterend",
  '<button id="b2meGuest" class="textLink" style="color:white;margin:12px auto;display:block" onclick="enterGuest()">'+
  msg("التصفح كزائر","Continue as Guest")+'</button>');
 const guest=el("b2meGuest");
 if(guest&&!el("b2meForgotLink")){
  guest.insertAdjacentHTML("afterend",
    '<a id="b2meForgotLink" href="forgot-password.html" class="textLink" style="color:#f4dcf3;margin:12px auto;display:block;text-align:center">'+
    msg("نسيت كلمة المرور؟","Forgot password?")+'</a>');
 }
};})(renderAuth);
window.enterGuest=function(){screen="home";liveRender();};
submitAuth=async function(e){
 e.preventDefault();
 const email=el("emailAuth").value.trim(),pass=el("passwordAuth").value;
 const error=el("authError");error.textContent="";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pass.length<8){
  error.textContent=msg("أدخل إيميل صحيح وكلمة مرور من 8 أحرف على الأقل.","Enter a valid email and 8+ character password.");return;
 }
 if(authMode==="signup"&&pass!==el("passwordAgain")?.value){
  error.textContent=t("authConfirm");return;
 }
 const button=e.target.querySelector('button[type="submit"]');
 button.disabled=true;
 try{
  if(authMode==="signup"){
    const result=await api.signUp(email,pass,el("remember").checked);
    if(result?.access_token&&result?.user){
      activeUser=result.user;
      // Signup may create a session when email confirmation is disabled.
      await loadPersonal();go("choice");
    }else{
      error.textContent=msg("أرسلنا رسالة تحقق إلى بريدك. تأكد من الإيميل ثم سجل دخولك.",
       "Check your email to verify your account, then sign in.");
      authMode="signin";
    }
  }else{
   const s=await api.signIn(email,pass,el("remember").checked);
   activeUser=s.user;
   sessionStorage.setItem("b2me_email",activeUser.email||email);
   await loadPersonal();
   go("choice");
  }
 }catch(ex){error.textContent=ex?.message||msg("تعذر إكمال التسجيل.","Authentication failed.");}
 finally{button.disabled=false;}
};
window.b2meLogout=async function(){
 try{await api.signOut();activeUser=null;favorites=[];liveNotices=[];screen="auth";liveRender();}
 catch(e){report(e);}
};
renderChoice=(function(old){return function(){
 old();
 const container=el("choice").querySelector(".choiceWrap");
 if(activeUser){
  container.insertAdjacentHTML("beforeend",
   '<p class="choiceHint">'+esc(activeUser.email||"")+'</p>'+
   '<button class="textLink" onclick="b2meLogout()">'+msg("تسجيل الخروج","Sign Out")+'</button>'+
   '<a class="textLink" style="display:block" href="provider-dashboard.html">'+
   msg("لوحة مزود الخدمة","Provider Dashboard")+'</a>'+
   '<button class="textLink" onclick="b2meMyRequests()">'+
   msg("طلباتي المرسلة","My inquiries")+'</button>');
 }else{
  container.insertAdjacentHTML("beforeend",'<button class="textLink" onclick="go(\'auth\')">'+
  msg("تسجيل الدخول","Sign In")+'</button>');
 }
};})(renderChoice);
go=(function(original){return function(dest){
 if((dest==="request"||dest==="provider_join")&&!requireAuth())return;
 if((dest==="profile"||dest==="request")&&!companies.some(c=>c.id===selectedCompany)){
  toast(msg("لا توجد شركة مختارة بعد.","Please select a business first."));return;
 }
 return original(dest);
};})(go);
companyLogo=function(c){
 if(c.dashboardLogo)return '<img src="'+esc(sanitizedUrl(c.dashboardLogo))+'" alt="Logo">';
 return '<span>'+esc(c.logo||"B2")+'</span>';
};
renderProfile=function(){
 const c=companies.find(x=>x.id===selectedCompany);
 if(!c){el("profile").innerHTML=topbar(t("company"),"listings")+'<p class="empty">'+
    msg("لا توجد شركات معتمدة حالياً.","No approved providers yet.")+"</p>";return;}
 const services=(language==="ar"?c.servicesAr:c.servicesEn)||[];
 let markup=topbar(t("company"),"listings")+
 '<div class="pageBody"><div class="profileCover"'+
 (c.dashboardCover?' style="background-image:url(&quot;'+esc(c.dashboardCover)+'&quot;);background-size:cover"':"")+
 '></div><div class="profileSummary"><div class="companyLogo">'+companyLogo(c)+
 '</div><h2>'+esc(cname(c))+'</h2><span class="smallPill">'+esc(catName(c.sector))+
 '</span><p>'+esc(language==="ar"?c.bioAr:c.bioEn)+'</p>'+
 '<div class="inlineBadges">'+services.map(x=>'<span>'+esc(x)+'</span>').join("")+
 '</div></div><div class="infoCard"><h3>'+t("contact")+"</h3>";
 if(c.email)markup+=infoRow("mail",t("email"),c.email);
 if(c.phone)markup+=infoRow("phone",t("phone"),c.phone);
 if(c.site)markup+=infoRow("globe",t("website"),c.site,true);
 markup+='</div><button class="cta" onclick="go(\'request\')">'+t("connect")+
  " "+uiIcon("arrow")+"</button></div>";
 el("profile").innerHTML=markup;
};
renderRequest=function(){
 const c=companies.find(x=>x.id===selectedCompany);
 if(!c){el("request").innerHTML=topbar(t("serviceTitle"),"listings");return;}
 el("request").innerHTML=topbar(t("serviceTitle"),"profile",esc(cname(c)))+
 '<div class="pageBody"><div class="formNotice">'+
 msg("يُحفظ طلبك في حساب الشركة داخل B2ME؛ الإرسال إلى الإيميل غير مفعّل حالياً.",
 "Your inquiry is saved to the provider inbox; email delivery is not yet enabled.")+
 '</div><form class="formCard" onsubmit="submitRequest(event)">'+
 fieldInput("rqName",t("personName"),"text",true)+
 fieldInput("rqEmail",t("email"),"email",true,activeUser?.email||"")+
 fieldInput("rqPhone",t("phone"),"tel",true)+
 '<div class="field"><label>'+t("companyName")+'</label><input id="rqCompany"></div>'+
 '<div class="field"><label>'+t("describe")+' *</label>'+
 '<textarea id="rqDesc" required minlength="10" maxlength="8000"></textarea></div>'+
 '<button class="cta" type="submit">'+msg("إرسال طلب التواصل","Send Inquiry")+
 '</button></form></div>';
 const emailInput=el("rqEmail");emailInput.readOnly=true;
};
submitRequest=async function(e){
 e.preventDefault();if(!requireAuth())return;
 const company=companies.find(c=>c.id===selectedCompany);
 if(!company)return;
 const name=el("rqName").value.trim(),msgBody=el("rqDesc").value.trim();
 if(name.length<2||msgBody.length<10){toast(msg("أكمل الاسم والوصف.","Enter your name and request details."));return;}
 const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;
 try{
  await api.insert("inquiries",{
   sender_id:activeUser.id,recipient_company_id:company.id,
   subject:msg("طلب تواصل من ","Inquiry from ")+name,message:msgBody,
   contact_name:name,contact_phone:el("rqPhone").value.trim(),
   contact_business:el("rqCompany").value.trim()
  });
  toast(msg("تم إرسال طلبك إلى صندوق مزود الخدمة.","Inquiry sent to the provider inbox."));
  go("profile");
 }catch(ex){report(ex);}
 finally{btn.disabled=false;}
};
toggleFavorite=async function(id){
 if(!requireAuth())return;
 try{
  if(favorites.includes(id))await api.remove("company_favorites",
   {user_id:"eq."+activeUser.id,company_id:"eq."+id});
  else await api.insert("company_favorites",{user_id:activeUser.id,company_id:id});
  favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];liveRender();
 }catch(ex){report(ex);}
};
chooseCategory=function(id){
 filter=id;
 const c=categoriesData.find(x=>x.id===id);
 if(activeUser&&c)api.insert("user_interests",{user_id:activeUser.id,category_id:c.dbId})
  .catch(()=>{}); // Duplicate interest is harmless to browsing.
 go("listings");
};
openCompany=function(id){
 const c=companies.find(x=>x.id===id);if(!c)return;
 selectedCompany=id;
 if(activeUser){
  const cat=categoriesData.find(x=>x.id===c.sector);
  if(cat)api.insert("user_interests",{user_id:activeUser.id,category_id:cat.dbId}).catch(()=>{});
 }
 go("profile");
};
renderProviderJoin=function(){
 el("provider_join").innerHTML=topbar(t("onboarding"),"choice")+
 '<div class="pageBody"><div class="formNotice">'+
 msg("أنشئ ملف نشاطك؛ يظهر للعامة بعد مراجعة الإدارة.",
 "Submit your business profile for review before it goes public.")+
 '</div><form class="formCard" onsubmit="submitProviderJoin(event)">'+
 fieldInput("pvName",t("personName"),"text",true)+
 fieldInput("pvEmail",t("email"),"email",true,activeUser?.email||"")+
 fieldInput("pvPhone",t("phone"),"tel",true)+
 '<label class="remember" style="color:#525c73;margin-bottom:14px">'+
 '<input id="pvFreelance" type="checkbox" onchange="el(\'pvCompany\').required=!this.checked"> '+
 t("freelancer")+'</label>'+fieldInput("pvCompany",t("businessName"),"text",true)+
 '<button type="submit" class="cta">'+t("joinSubmit")+"</button></form></div>";
 el("pvEmail").readOnly=true;
};
submitProviderJoin=async function(e){
 e.preventDefault();if(!requireAuth())return;
 const name=el("pvName").value.trim();
 const freelance=el("pvFreelance").checked;
 const companyName=el("pvCompany").value.trim()||name;
 if(companyName.length<2){toast(msg("ادخل اسم النشاط.","Enter provider name."));return;}
 const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;
 try{
  const generated=globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID().replace(/-/g,"").slice(0,16):
   (Date.now().toString(36)+Math.random().toString(36).slice(2,8));
  await api.insert("companies",{
   owner_id:activeUser.id,provider_type:freelance?"freelancer":"company",
   slug:"b2me-"+generated,name_ar:companyName,
   contact_name:name,public_email:activeUser.email,public_phone:el("pvPhone").value.trim(),
   country_code:"IQ"
  });
  toast(msg("تم تقديم طلب الانضمام للمراجعة.","Provider application submitted for review."));
  go("choice");
 }catch(ex){report(ex);}
 finally{btn.disabled=false;}
};
renderNotifications=function(){
 const items=activeUser?liveNotices:[];
 el("notifications").innerHTML=topbar(t("notifications"))+
 '<div class="pageBody">'+(items.length?items.map(n=>
  '<div class="notificationItem"><div class="notiDot"></div><div><strong>'+
  esc(n.title)+'</strong><p>'+esc(n.body)+'</p><small>'+
  esc(new Date(n.created_at).toLocaleString(language==="ar"?"ar-IQ":"en-GB"))+
  '</small></div></div>').join(""):"<p class='empty'>"+
  msg(activeUser?"ماكو إشعارات حالياً.":"سجّل دخولك حتى تشوف إشعاراتك.",
      activeUser?"No notifications yet.":"Sign in to see your notifications.")+
  "</p>")+"</div>";
};
openNotifications=function(){go("notifications");if(activeUser)loadPersonal();};
renderHome=(function(old){return function(){
 old();
 if(!companies.length){
  const home=el("home");
  const note=document.createElement("p");
  note.className="empty";note.textContent=catalogReady?
   msg("ماكو شركات معتمدة بعد. تظهر هنا أول ما تُعتمد.",
       "No approved providers yet. Listings will appear after review."):
   msg("جاري جلب الشركات من الخادم...","Loading providers...");
  home.appendChild(note);
 }
};})(renderHome);
render=(function(old){return function(){
 old();
 if(!catalogReady&&companies.length)companies.splice(0);
 const status=el("demoSubtitle");
 if(status)status.textContent=catalogReady?
   msg("B2ME • متصل بقاعدة البيانات","B2ME • Connected to database"):
   msg("B2ME • تحميل البيانات","B2ME • Loading data");
};})(render);
window.b2meMyRequests=async function(){
 if(!requireAuth())return;
 const previous=document.getElementById("b2meRequestsDialog");if(previous)previous.remove();
 const overlay=document.createElement("div");overlay.id="b2meRequestsDialog";
 overlay.style.cssText="position:fixed;inset:0;z-index:10000;background:#070a20ed;padding:18px;display:flex;align-items:center;justify-content:center;direction:"+(language==="ar"?"rtl":"ltr");
 overlay.innerHTML='<section style="max-width:510px;width:100%;max-height:85vh;overflow:auto;background:white;color:#20253c;padding:20px;border-radius:18px">'+
 '<div style="display:flex;justify-content:space-between;align-items:center"><h2>'+
 msg("طلبات التواصل المرسلة","My sent inquiries")+'</h2>'+
 '<button type="button" id="b2meCloseRequests" style="border:0;background:none;font-size:24px;cursor:pointer">×</button></div>'+
 '<div id="b2meRequestsList">'+msg("جاري تحميل الطلبات...","Loading inquiries...")+'</div></section>';
 document.body.appendChild(overlay);
 document.getElementById("b2meCloseRequests").onclick=()=>overlay.remove();
 try{
  const rows=await api.list("inquiries",{sender_id:"eq."+activeUser.id,
   order:"created_at.desc",limit:100},true);
  const names=new Map(companies.map(c=>[c.id,language==="ar"?c.ar:c.en]));
  document.getElementById("b2meRequestsList").innerHTML=rows.length?
   rows.map(x=>'<div style="border-top:1px solid #ddd;padding:13px 2px">'+
    '<strong>'+esc(x.subject)+'</strong><p>'+esc(x.message)+'</p>'+
    '<small style="color:#737b95">'+esc(names.get(x.recipient_company_id)||msg("مزود خدمة","Provider"))+
    ' • '+esc(x.status)+' • '+
    esc(new Date(x.created_at).toLocaleString(language==="ar"?"ar-IQ":"en-GB"))+
    '</small></div>').join(""):
   '<p>'+msg("ماكو طلبات تواصل مرسلة بعد.","No inquiries sent yet.")+'</p>';
 }catch(ex){
  const list=document.getElementById("b2meRequestsList");
  if(list)list.textContent=ex?.message||msg("تعذّر تحميل الطلبات","Failed to load inquiries");
 }
};
window.b2meMarkNotificationsRead=async function(){
 if(!activeUser)return;
 try{
  await api.update("notifications",{is_read:true},{
   user_id:"eq."+activeUser.id,is_read:"eq.false"});
  await loadPersonal();
  toast(msg("تم تعليم الإشعارات كمقروءة.","Notifications marked as read."));
 }catch(ex){report(ex);}
};
renderNotifications=(function(old){return function(){
 old();
 if(activeUser&&liveNotices.some(n=>!n.is_read)){
  const page=el("notifications")?.querySelector(".pageBody");
  if(page)page.insertAdjacentHTML("beforeend",
   '<button class="cta" onclick="b2meMarkNotificationsRead()">'+
   msg("تعليم الكل كمقروء","Mark all as read")+'</button>');
 }
};})(renderNotifications);
async function bootstrap(){
 if(started)return;started=true;
 // A former demo "session" must never log a user in.
 activeUser=null;favorites=[];liveNotices=[];
 screen="auth";render();
 await loadCatalog();
 try{
  const callback=await api.consumeEmailLink();
  if(callback.type==="error")toast(msg("رابط التحقق غير صالح أو منتهي.","Verification link is invalid or expired."));
  const s=await api.currentSession();
  if(s?.user){activeUser=s.user;sessionStorage.setItem("b2me_email",s.user.email||"");await loadPersonal();screen="choice";liveRender();}
  else {screen="auth";liveRender();}
 }catch(ex){screen="auth";liveRender();report(ex);}
}
bootstrap();
})();
