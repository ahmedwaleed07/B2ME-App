/* Live B2ME mobile app integration. Visuals and original brand images stay untouched. */
(function(){
"use strict";
const api=window.B2ME_API;
if(!api){console.error("B2ME API client missing");return;}
// The choice screen is part of the agreed navigation, not a small secondary link.
if(!document.getElementById("b2meChoiceStyles")){
 const style=document.createElement("style");style.id="b2meChoiceStyles";
 style.textContent=
 ".choiceWrap .b2me-choice-prompt{font-size:15px;font-weight:700;color:#e7dcef;margin:0 0 5px;}"+
 ".choiceWrap .cta{font-size:15px;min-height:52px;margin-top:17px;}"+
 ".choiceWrap .b2me-choice-secondary{display:flex;align-items:center;justify-content:center;"+
 "width:100%;min-height:52px;margin-top:13px;padding:13px 16px;"+
 "border:1.5px solid #e38af2;border-radius:13px;background:#ffffff12;"+
 "font-size:15px;font-weight:800;color:#fff;text-decoration:none;"+
 "box-shadow:0 7px 22px #10051b30;}"+
 ".choiceWrap .b2me-choice-secondary:focus-visible,.choiceWrap .cta:focus-visible{"+
 "outline:3px solid white;outline-offset:3px;}"+
 ".choiceWrap .choiceHint{font-size:12px;margin-top:12px;}"+
 ".b2me-form-heading{font-weight:800;margin:14px 0 8px;font-size:16px;}"+
 ".b2me-social-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}"+
 ".b2me-social-grid input{width:100%;min-width:0;}"+
 ".b2me-required-note{font-size:11px;color:#646d85;margin:10px 0;line-height:1.7;}"+
 ".b2me-provider-note{background:#f1ecfb;border-inline-start:3px solid #9855dc;"+
 "border-radius:10px;padding:12px 14px;font-size:12px;line-height:1.9;color:#4e426b;"+
 "margin:17px 0;}"+
 ".b2me-form-section{margin:16px 0;}"+
 ".b2me-form-section label{font-size:12px;font-weight:700;display:block;margin:8px 0 5px;}";

 document.head.appendChild(style);
}
langStrings.ar.guestNote="البيانات المعروضة مباشرة من B2ME. تظهر الشركات بعد موافقة الإدارة.";
langStrings.en.guestNote="Live B2ME data. Providers appear after administrative approval.";
langStrings.ar.demoStatus="متصل بقاعدة بيانات B2ME";
langStrings.en.demoStatus="Connected to B2ME database";
langStrings.ar.authError="تأكد من الإيميل وكلمة المرور (8 أحرف على الأقل).";
langStrings.en.authError="Enter a valid email and password (at least 8 characters).";
langStrings.ar.notificationNote="إشعاراتك الحقيقية من B2ME";
langStrings.ar.explore="استكشف الشركات";
langStrings.ar.offerHelp="تريد تعرض خدماتك؟";
langStrings.en.explore="Explore Companies";
langStrings.en.offerHelp="Want to Offer Your Services?";
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
 if(box&&!el("b2meForgotLink"))box.insertAdjacentHTML("afterend",
   '<a id="b2meForgotLink" href="forgot-password.html" class="textLink" '+
   'style="color:#f4dcf3;margin:12px auto;display:block;text-align:center">'+
   msg("نسيت كلمة المرور؟","Forgot password?")+'</a>');
};})(renderAuth);
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
 const explore=container.querySelector(".cta");
 const offer=container.querySelector(".textLink");
 const heading=container.querySelector("h2");
 if(heading&&!container.querySelector(".b2me-choice-prompt"))
  heading.insertAdjacentHTML("afterend",
   '<p class="b2me-choice-prompt">'+msg("شنو تحب تسوي؟","What would you like to do?")+'</p>');
 if(explore)explore.innerHTML=msg("استكشف الشركات","Explore Companies")+" "+uiIcon("arrow");
 if(offer){
  offer.classList.add("b2me-choice-secondary");
  offer.textContent=msg("تريد تعرض خدماتك؟","Want to Offer Your Services?");
 }
 const hint=container.querySelector(".choiceHint");
 if(hint)hint.textContent=msg("للشركات والمستقلين وأصحاب المهن",
 "For companies, freelancers and professionals");
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
 if(dest==="request"&&!requireAuth())return;
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

let b2meProviderDraft=null;
const initialNoteAr="هذه الاستمارة تعد استمارة تسجيل اولية و بعد تأكيد التسجيل سيتم تزويدكم بمنصة خاصة بحسابكم لرفع معلومات و صور و نماذج اعمالكم مع وسائل التواصل معكم.";
const initialNoteEn="This is a preliminary registration form. Once registration is confirmed, you will receive access to your own platform for uploading your information, photos, work samples and contact details.";
function providerFormField(id,ar,en,type="text",required=false,max=200,value=""){
 const label=msg(ar,en);
 return '<div class="field"><label for="'+id+'">'+label+(required?' *':'')+'</label>'+
 '<input id="'+id+'" type="'+type+'"'+(required?' required':'')+' maxlength="'+max+
 '" autocomplete="off" value="'+esc(value)+'"></div>';
}
renderProviderJoin=function(){
 el("provider_join").innerHTML=topbar(msg("تسجيل مزود خدمة","Provider Registration"),"choice")+
 '<div class="pageBody"><h2 class="b2me-form-heading">'+
 msg("استمارة التسجيل الأولي","Initial Registration Form")+'</h2>'+
 '<form class="formCard" id="b2meProviderForm" onsubmit="submitProviderJoin(event)">'+
 providerFormField("pvName","الاسم الكامل","Full name","text",true,160)+
 providerFormField("pvTitle","العنوان الوظيفي","Job title","text",false,160)+
 providerFormField("pvCompany","اسم الشركة","Company name","text",false,200)+
 providerFormField("pvPhone","رقم الهاتف","Phone number","tel",true,30)+
 providerFormField("pvEmail","الايميل","Email address","email",true,320,activeUser?.email||"")+
 providerFormField("pvWebsite","الموقع الرسمي","Official website","url",false,500)+
 '<div class="b2me-form-section"><h3>'+msg("حسابات التواصل الاجتماعي","Social media accounts")+'</h3>'+
 '<div class="b2me-social-grid">'+
 providerFormField("pvFacebook","فيسبوك","Facebook","url",false,500)+
 providerFormField("pvInstagram","إنستغرام","Instagram","url",false,500)+
 providerFormField("pvLinkedIn","لينكدإن","LinkedIn","url",false,500)+
 providerFormField("pvX","إكس / تويتر","X / Twitter","url",false,500)+
 '</div></div>'+
 '<p class="b2me-required-note">'+msg("* الحقول الإجبارية: الاسم الكامل، رقم الهاتف، الايميل.",
 "* Required fields: full name, phone number and email.")+'</p>'+
 '<div class="b2me-provider-note" role="note">'+
 msg(initialNoteAr,initialNoteEn)+'</div>'+
 '<button class="cta" type="submit">'+msg("تأكيد البيانات والمتابعة","Continue Registration")+
 '</button></form></div>';
 if(activeUser)el("pvEmail").readOnly=true;
};
function collectProviderForm(){
 const get=id=>el(id)?.value.trim()||"";
 const full_name=get("pvName"),phone=get("pvPhone"),email=get("pvEmail").toLowerCase();
 if(full_name.length<2||full_name.length>160)throw Error(msg("أدخل الاسم الكامل.","Enter your full name."));
 if(!/^\+?[0-9\s()\-]{7,30}$/.test(phone)||phone.replace(/\D/g,"").length<7)
  throw Error(msg("أدخل رقم هاتف صحيح.","Enter a valid phone number."));
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error(msg("أدخل إيميل صحيح.","Enter a valid email."));
 if(activeUser&&activeUser.email?.toLowerCase()!==email)
  throw Error(msg("الإيميل يجب أن يطابق حسابك المسجّل.","Use your signed-in account email."));
 return {full_name,job_title:get("pvTitle"),company_name:get("pvCompany"),
 phone,email,website:get("pvWebsite"),
 social_links:Object.fromEntries([
  ["facebook","pvFacebook"],["instagram","pvInstagram"],
  ["linkedin","pvLinkedIn"],["x","pvX"]
 ].map(([network,id])=>[network,get(id)]).filter(([,value])=>value))};
}
async function saveExistingProviderRegistration(data){
 const newId=typeof crypto!=="undefined"&&crypto.randomUUID?
  crypto.randomUUID().replace(/-/g,""):(Date.now().toString(36)+Math.random().toString(36).slice(2,15));
 return api.insert("companies",{
  owner_id:activeUser.id,
  provider_type:data.company_name?"company":"freelancer",
  slug:"b2me-"+newId,
  name_ar:data.company_name||data.full_name,
  contact_name:data.full_name,job_title:data.job_title||null,
  public_phone:data.phone,public_email:data.email,
  website:data.website||null,social_links:data.social_links,country_code:"IQ"
 });
}
function registrationConfirmation(message){
 el("provider_join").innerHTML=topbar(msg("تأكيد التسجيل","Registration Confirmation"),"choice")+
 '<div class="pageBody"><div class="formCard"><h2>'+
 msg("تم استلام طلب التسجيل الأولي","Initial registration received")+'</h2>'+
 '<p class="b2me-provider-note">'+esc(message)+'</p>'+
 '<p class="b2me-provider-note">'+msg(initialNoteAr,initialNoteEn)+'</p>'+
 '<button class="cta" onclick="go(\'choice\')">'+
 msg("العودة إلى الصفحة الرئيسية","Return to start")+'</button></div></div>';
}
submitProviderJoin=async function(e){
 e.preventDefault();const button=e.target.querySelector('button[type="submit"]');
 if(button?.disabled)return;
 button.disabled=true;
 try{
  const data=collectProviderForm();
  b2meProviderDraft=data;
  if(activeUser){
    await saveExistingProviderRegistration(data);
    registrationConfirmation(msg("تم إرسال استمارتك إلى الإدارة للمراجعة. ستظهر بياناتك بعد اعتمادها.",
    "Your application was submitted for review. Your profile will appear once approved."));
    return;
  }
  el("provider_join").innerHTML=topbar(msg("إنشاء الحساب","Create Your Account"),"provider_join")+
   '<div class="pageBody"><div class="formCard"><h2>'+
   msg("الخطوة الثانية: تأمين الحساب","Step 2: Secure your account")+'</h2>'+
   '<p class="subtle">'+msg("تم حفظ بيانات الاستمارة مؤقتاً. اختر كلمة مرور لحسابك ثم أكّد الإيميل.",
   "Your form details are temporarily ready. Choose an account password and verify your email.")+'</p>'+
   '<form id="providerAccountForm" onsubmit="b2meCompleteProviderSignup(event)">'+
   providerFormField("pvPassword","كلمة المرور (8 أحرف على الأقل)","Password (8 characters minimum)","password",true,128)+
   providerFormField("pvPasswordConfirm","تأكيد كلمة المرور","Confirm password","password",true,128)+
   '<button class="cta" type="submit">'+msg("إنشاء الحساب وإرسال رسالة التحقق","Create Account & Verify Email")+
   '</button></form></div></div>';
 }catch(ex){report(ex);}
 finally{if(button)button.disabled=false;}
};
window.b2meCompleteProviderSignup=async function(e){
 e.preventDefault();
 const data=b2meProviderDraft;
 if(!data){toast(msg("أعد ملء الاستمارة.","Please complete the form again."));go("provider_join");return;}
 const password=el("pvPassword").value;
 const confirm=el("pvPasswordConfirm").value;
 if(password.length<8){toast(msg("كلمة المرور قصيرة.","Password must be at least 8 characters."));return;}
 if(password!==confirm){toast(msg("كلمتا المرور غير متطابقتين.","Passwords do not match."));return;}
 const button=e.target.querySelector('button[type="submit"]');
 button.disabled=true;
 try{
  const registration={
   full_name:data.full_name,job_title:data.job_title,
   company_name:data.company_name,phone:data.phone,
   website:data.website,social_links:data.social_links
  };
  const result=await api.signUp(data.email,password,true,
   {b2me_provider_registration:registration});
  if(result?.access_token&&result?.user){
    activeUser=result.user;
    await loadPersonal();
  }
  b2meProviderDraft=null;
  registrationConfirmation(msg(
    "أُرسل طلب التسجيل. إذا وصلتك رسالة تحقق، افتحها وأكّد بريدك الإلكتروني. وبعد تأكيد التسجيل ومراجعة الطلب تتوفر لك منصة مزود الخدمة.",
    "Registration submitted. Check your email for a verification link. After confirmation and review, your provider dashboard will be available."));
 }catch(ex){report(ex);}
 finally{button.disabled=false;}
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
 screen="choice";render();
 await loadCatalog();
 try{
  const callback=await api.consumeEmailLink();
  if(callback.type==="error")toast(msg("رابط التحقق غير صالح أو منتهي.","Verification link is invalid or expired."));
  const s=await api.currentSession();
  if(s?.user){activeUser=s.user;sessionStorage.setItem("b2me_email",s.user.email||"");await loadPersonal();screen="choice";liveRender();}
  else {screen="choice";liveRender();}
 }catch(ex){screen="choice";liveRender();report(ex);}
}
bootstrap();
})();
