/* Live B2ME provider dashboard, preserving the original approved UI and brand assets. */
(function(){
"use strict";
const api=window.B2ME_API;
if(!api){console.error("B2ME API unavailable");return;}
let user=null,company=null,companies=[],categoryRows=[],serviceRows=[],offerRows=[],inquiryRows=[];
const el=id=>document.getElementById(id);
const h=x=>escapeHtml(String(x??""));
const safeUrl=x=>/^https?:\/\//i.test(x||"")?x:"";
const error=e=>{console.error("B2ME Dashboard",e);alert("تعذر تنفيذ العملية: "+(e?.message||String(e)));};
const statusBadge=()=>company?.status==="approved"?"معتمد":company?.status==="pending"?"بانتظار موافقة الإدارة":
 company?.status==="rejected"?"مرفوض":"موقوف";
function installGate(){
 const overlay=document.createElement("div");
 overlay.id="b2meLiveGate";
 overlay.style.cssText="position:fixed;z-index:9999;inset:0;background:#0a0e27fa;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;direction:rtl";
 overlay.innerHTML='<section style="background:#fff;max-width:430px;width:100%;padding:28px;border-radius:20px;box-shadow:0 18px 80px #0005;text-align:right">'+
 '<h2 style="margin:0 0 10px;color:#1a1b2b">B2ME • لوحة مقدم الخدمة</h2>'+
 '<p id="b2meGateDescription" style="color:#687089;margin-bottom:16px">سجّل دخولك بحساب B2ME الحقيقي حتى تشوف نشاطك وطلباتك.</p>'+
 '<form id="b2meDashboardSignIn"><label style="display:block">البريد الإلكتروني</label>'+
 '<input required type="email" id="b2meDashboardEmail" autocomplete="email" style="width:100%;padding:12px;margin:7px 0 14px;border:1px solid #ccc;border-radius:9px">'+
 '<label style="display:block">كلمة المرور</label>'+
 '<input required type="password" id="b2meDashboardPassword" autocomplete="current-password" style="width:100%;padding:12px;margin:7px 0 14px;border:1px solid #ccc;border-radius:9px">'+
 '<label><input type="checkbox" id="b2meDashboardRemember" checked> تذكرني</label>'+
 '<button class="btn" style="width:100%;margin-top:18px" type="submit">تسجيل الدخول</button></form>'+
 '<p style="font-size:13px;color:#667;margin-top:14px">مستخدم جديد؟ <a href="index.html" style="color:#d51ccf">أنشئ حساب B2ME بالتطبيق</a>'+
 ' · <a href="forgot-password.html" style="color:#d51ccf">نسيت كلمة المرور؟</a></p>'+
 '</section>';
 document.body.appendChild(overlay);
 el("b2meDashboardSignIn").addEventListener("submit",async function(ev){
  ev.preventDefault();const btn=this.querySelector("button");btn.disabled=true;
  try{
   const s=await api.signIn(el("b2meDashboardEmail").value.trim(),el("b2meDashboardPassword").value,
    el("b2meDashboardRemember").checked);
   user=s.user;overlay.style.display="none";await refreshAll();
  }catch(e){error(e);}finally{btn.disabled=false;}
 });
}
function installToolbar(){
 const top=document.querySelector(".main .top");
 if(!top||el("b2meToolbar"))return;
 const area=document.createElement("div");area.id="b2meToolbar";area.style.cssText=
 "display:flex;gap:8px;align-items:center;flex-wrap:wrap";
 area.innerHTML='<label for="b2meProviderSelector" style="font-size:12px">نشاطي</label>'+
 '<select id="b2meProviderSelector" style="padding:10px;border:1px solid #ddd;border-radius:9px;max-width:200px"></select>'+
 '<button type="button" class="btn gray" id="b2meAddProvider">نشاط جديد</button>'+
 '<button type="button" class="btn gray" id="b2meSignOut">خروج</button>';
 top.appendChild(area);
 el("b2meProviderSelector").addEventListener("change",async e=>{
  company=companies.find(c=>c.id===e.target.value)||null;await loadCompanyData();
 });
 el("b2meAddProvider").onclick=showNewProviderForm;
 el("b2meSignOut").onclick=async()=>{
  try{await api.signOut();user=null;company=null;el("b2meLiveGate").style.display="flex";}
  catch(e){error(e);}
 };
}
function showNewProviderForm(){
 const existing=el("b2meNewProviderDialog");if(existing){existing.remove();return;}
 const box=document.createElement("div");box.id="b2meNewProviderDialog";box.className="card";
 box.style.cssText="max-width:520px;margin:12px auto;border:2px solid #d51ccf;position:relative";
 box.innerHTML='<h2>إنشاء نشاط جديد</h2><p>النشاط يظهر للعامة بعد موافقة الإدارة.</p>'+
 '<form id="b2meNewProviderForm"><label>اسم الشركة أو المستقل</label>'+
 '<input id="b2meNewName" maxlength="200" minlength="2" required style="width:100%;padding:12px;margin:8px 0">'+
 '<label>نوع النشاط</label><select id="b2meNewType" style="width:100%;padding:12px;margin:8px 0">'+
 '<option value="company">شركة</option><option value="freelancer">مستقل</option>'+
 '<option value="professional">مهني</option></select><div class="row">'+
 '<button class="btn" type="submit">إرسال للمراجعة</button>'+
 '<button class="btn gray" type="button" onclick="document.getElementById(\'b2meNewProviderDialog\').remove()">إلغاء</button>'+
 '</div></form>';
 document.querySelector(".main").insertBefore(box,document.querySelector(".main .panel"));
 el("b2meNewProviderForm").addEventListener("submit",async e=>{
  e.preventDefault();const btn=e.target.querySelector("button[type=submit]");btn.disabled=true;
  try{
   const id=crypto?.randomUUID?crypto.randomUUID().replace(/-/g,"").slice(0,20):
    Date.now().toString(36);
   const created=await api.insert("companies",{
    owner_id:user.id,provider_type:el("b2meNewType").value,
    slug:"b2me-"+id,name_ar:el("b2meNewName").value.trim(),country_code:"IQ"
   });
   box.remove();await refreshAll(created?.id);tip();
  }catch(ex){error(ex);}finally{btn.disabled=false;}
 });
}
async function refreshAll(preferId){
 const [myCompanies,cats]=await Promise.all([
  api.list("companies",{owner_id:"eq."+user.id,order:"created_at.desc"},true),
  api.list("categories",{is_active:"eq.true",order:"sort_order.asc"},true)
 ]);
 companies=myCompanies;categoryRows=cats;
 const selector=el("b2meProviderSelector");
 selector.innerHTML=companies.map(c=>'<option value="'+h(c.id)+'">'+h(c.name_ar)+'</option>').join("");
 company=companies.find(c=>c.id===(preferId||company?.id))||companies[0]||null;
 if(company)selector.value=company.id;
 const select=el("bizCat");
 select.innerHTML=categoryRows.map(c=>'<option value="'+h(c.id)+'">'+h(c.name_ar)+'</option>').join("");
 if(!company){
  serviceRows=[];offerRows=[];inquiryRows=[];
  state={...DEFAULT,name:"",email:user.email||"",phone:"",cat:"",
   city:"",desc:"",website:"",facebook:"",instagram:"",linkedin:"",
   logo:"",cover:"",services:[],offers:[]};
  draw();
  showNewProviderForm();
  return;
 }
 if(el("b2meNewProviderDialog"))el("b2meNewProviderDialog").remove();
 await loadCompanyData();
}
function mapCompany(){
 if(!company)return;
 const links=company.social_links||{};
 state={...state,name:company.name_ar,cat:String(company.primary_category_id||categoryRows[0]?.id||""),
  email:company.public_email||user.email||"",phone:company.public_phone||"",
  website:company.website||"",city:company.city||"",facebook:links.facebook||"",
  instagram:links.instagram||"",linkedin:links.linkedin||"",
  desc:company.description_ar||"",logo:safeUrl(company.logo_url),cover:safeUrl(company.cover_url)};
}
async function loadCompanyData(){
 if(!company)return;
 try{
  const [ls,os,ins]=await Promise.all([
   api.list("listings",{company_id:"eq."+company.id,order:"created_at.desc"},true),
   api.list("provider_offers",{company_id:"eq."+company.id,order:"created_at.desc"},true),
   api.list("inquiries",{recipient_company_id:"eq."+company.id,order:"created_at.desc",limit:100},true)
  ]);
  serviceRows=ls;offerRows=os;inquiryRows=ins;
  mapCompany();
  state.services=serviceRows.map(x=>x.title_ar);
  state.offers=offerRows.map(o=>({
   id:o.id,title:o.title_ar,desc:o.description_ar||"",
   price:o.price_note||"",enabled:o.requested_enabled,status:o.status
  }));
  draw();
 }catch(ex){error(ex);}
}
function draw(){
 render();
 // The old ASAS demo logo must never be presented as a new provider's logo.
 el("logoPreview").style.display=state.logo?"block":"none";
 if(!company){
  el("previewName").textContent="أضف نشاطك";
  el("previewDescription").textContent="لا يوجد ملف شركة مسجل بعد.";
  el("servicesList").innerHTML="";
  el("offersList").innerHTML="";
  el("leadContent").textContent="أنشئ نشاطاً حتى تظهر بياناته هنا.";
 }else{
  el("previewCategory").textContent=statusBadge();
  const offersList=el("offersList");
  offersList.innerHTML=offerRows.map((o,i)=>'<div class="item"><div><strong>'+
   h(o.title_ar)+'</strong><small>'+h(o.price_note||"")+' · الحالة: '+
   h(o.status)+'</small><small>'+h(o.description_ar||"")+'</small></div>'+
   '<div class="row"><button class="btn outline" onclick="editOffer('+i+')">تعديل</button>'+
   '<button class="btn gray" onclick="toggleOffer('+i+')">'+
   (o.requested_enabled?"إيقاف":"تفعيل")+'</button>'+
   '<button class="btn gray" onclick="deleteOffer('+i+')">حذف</button></div></div>').join("")
    ||'<p>لا توجد عروض بعد.</p>';
  el("servicesList").innerHTML=serviceRows.map((x,i)=>'<div class="item"><div><strong>'+
   h(x.title_ar)+'</strong><small>الحالة: '+h(x.status)+'</small></div>'+
   '<button class="btn gray" onclick="removeService('+i+')">حذف</button></div>').join("")||
   "<p>لا توجد خدمات بعد.</p>";
  el("offersTotal").textContent=offerRows.filter(x=>x.status==="approved"&&x.requested_enabled).length;
  el("leadContent").innerHTML=inquiryRows.length?inquiryRows.map(i=>
   '<div style="padding:12px;border-bottom:1px solid #ddd"><strong>'+h(i.subject)+
   '</strong><p>'+h(i.message)+'</p><small>'+h(i.contact_name||"")+' • '+
   h(i.contact_email||"")+' • '+h(i.contact_phone||"")+
   ' • '+h(i.contact_business||"")+' • '+h(i.status)+'</small>'+
   '<div class="row" style="margin-top:8px"><button class="btn outline" '+
   'onclick="updateInquiryStatus(\''+h(i.id)+'\',\'read\')">مقروء</button>'+
   '<button class="btn gray" onclick="updateInquiryStatus(\''+h(i.id)+'\',\'contacted\')">'+
   'تم التواصل</button><button class="btn gray" onclick="updateInquiryStatus(\''+
   h(i.id)+'\',\'closed\')">إغلاق</button></div></div>').join(""):"لا توجد طلبات تواصل بعد.";
 }
 const pill=document.querySelector(".main .top .pill");
 if(pill)pill.textContent=company?"B2ME Live · "+statusBadge():"B2ME Live";
 const footer=document.querySelector(".main .footnote");
 if(footer)footer.textContent="B2ME · لوحة مقدم الخدمة • البيانات محفوظة في Supabase. النشر والمزايا المدفوعة تتطلب موافقة الإدارة.";
}
persist=function(){/* browser-only demo persistence disabled for live provider data */};
saveCompany=async function(ev){
 ev.preventDefault();if(!company)return showNewProviderForm();
 const btn=ev.target.querySelector('button[type="submit"]');btn.disabled=true;
 try{
  const links={facebook:el("bizFacebook").value.trim(),
   instagram:el("bizInstagram").value.trim(),
   linkedin:el("bizLinkedin").value.trim()};
  await api.update("companies",{
   name_ar:el("bizName").value.trim(),primary_category_id:Number(el("bizCat").value)||null,
   public_email:el("bizEmail").value.trim(),public_phone:el("bizPhone").value.trim(),
   website:el("bizWebsite").value.trim(),city:el("bizCity").value.trim(),
   social_links:links,description_ar:el("bizDesc").value.trim()
  },{id:"eq."+company.id});
  await refreshAll(company.id);tip();
 }catch(ex){error(ex);}finally{btn.disabled=false;}
};
uploadMedia=async function(ev,key){
 if(!company){error(new Error("أنشئ نشاطاً أولاً"));return;}
 const file=ev.target.files?.[0];if(!file)return;
 try{
  const url=await api.uploadImage(file);
  await api.update("companies",{[key==="logo"?"logo_url":"cover_url"]:url},{id:"eq."+company.id});
  await refreshAll(company.id);tip();
 }catch(ex){error(ex);}
};
addService=async function(ev){
 ev.preventDefault();if(!company){showNewProviderForm();return;}
 const title=el("newService").value.trim();if(title.length<2)return;
 try{
  await api.insert("listings",{company_id:company.id,category_id:company.primary_category_id||null,
   listing_type:"service",title_ar:title});
  el("newService").value="";await loadCompanyData();tip();
 }catch(ex){error(ex);}
};
removeService=async function(i){
 const r=serviceRows[i];if(!r)return;
 if(r.status!=="pending"){alert("الخدمة المنشورة تحتاج مراجعة الإدارة قبل الحذف.");return;}
 if(!confirm("حذف الخدمة المنتظرة؟"))return;
 try{await api.remove("listings",{id:"eq."+r.id});await loadCompanyData();tip();}
 catch(ex){error(ex);}
};
saveOffer=async function(ev){
 ev.preventDefault();if(!company){showNewProviderForm();return;}
 const data={title_ar:el("offerTitle").value.trim(),
  description_ar:el("offerDesc").value.trim(),price_note:el("offerPrice").value.trim()};
 const idx=el("offerEditing").value;
 try{
  if(idx!==""){const item=offerRows[Number(idx)];if(!item)return;
   await api.update("provider_offers",data,{id:"eq."+item.id});}
  else await api.insert("provider_offers",{company_id:company.id,...data});
  resetOfferForm();await loadCompanyData();tip();
 }catch(ex){error(ex);}
};
editOffer=function(i){
 const o=offerRows[i];if(!o)return;
 navigate("offers");el("offerEditing").value=i;
 el("offerTitle").value=o.title_ar;
 el("offerPrice").value=o.price_note||"";
 el("offerDesc").value=o.description_ar||"";
 el("offerTitle").focus();
};
toggleOffer=async function(i){
 const o=offerRows[i];if(!o)return;
 try{
  await api.update("provider_offers",{requested_enabled:!o.requested_enabled},{id:"eq."+o.id});
  await loadCompanyData();tip();
 }catch(ex){error(ex);}
};
deleteOffer=async function(i){
 const o=offerRows[i];if(!o)return;
 if(o.status!=="pending"){alert("العرض المعتمد يحتاج تدخل الإدارة للحذف.");return;}
 if(!confirm("حذف هذا العرض؟"))return;
 try{await api.remove("provider_offers",{id:"eq."+o.id});await loadCompanyData();tip();}
 catch(ex){error(ex);}
};
window.updateInquiryStatus=async function(id,status){
 if(!company)return;
 try{await api.update("inquiries",{status},{id:"eq."+id});
  await loadCompanyData();tip();}
 catch(ex){error(ex);}
};
async function start(){
 // Remove local demo data so unrelated ASAS test content cannot be published as real data.
 try{localStorage.removeItem("b2me_provider_dashboard");}catch(_){}
 installGate();installToolbar();
 try{
  const s=await api.currentSession();
  if(s?.user){user=s.user;el("b2meLiveGate").style.display="none";await refreshAll();}
 }catch(ex){error(ex);}
}
start();
})();