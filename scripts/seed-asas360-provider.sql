-- ASAS 360° / B2ME provider data seed (NOT a schema migration).
-- Run manually in the B2ME Supabase SQL editor ONLY after a verified B2ME Auth
-- account for ASAS exists. This intentionally does NOT self-approve or publish.
-- Replace the email below with the verified owner login, not the public contact inbox.
-- The nine existing B2ME categories are reused; no new category is created.
-- Safe to rerun: existing company owner checked and services deduplicated.
DO $asas_seed$
DECLARE
  v_owner_email text := 'REPLACE_WITH_VERIFIED_B2ME_OWNER_EMAIL';
  v_owner uuid;
  v_existing_owner uuid;
  v_company uuid;
  v_primary_category bigint;
  v_category bigint;
  v_service record;
  v_services jsonb := '[{"category_slug":"tech","title_ar":"تصميم وتطوير المواقع الإلكترونية","title_en":"Website Design & Development"},{"category_slug":"tech","title_ar":"تطوير تطبيقات الهواتف الذكية","title_en":"Mobile App Development"},{"category_slug":"tech","title_ar":"تطوير أنظمة إدارة علاقات العملاء والموارد CRM وERP","title_en":"Custom CRM & ERP Systems"},{"category_slug":"tech","title_ar":"الأتمتة الذكية وتكامل أنظمة الأعمال","title_en":"Smart Automation & Systems Integration"},{"category_slug":"tech","title_ar":"شبكات الحاسوب والبنية التحتية التقنية","title_en":"IT Infrastructure & Networking"},{"category_slug":"tech","title_ar":"الدعم الفني وإدارة الأنظمة","title_en":"IT Support & Systems Management"},{"category_slug":"security","title_ar":"الأمن السيبراني وحماية البيانات","title_en":"Cybersecurity & Data Protection"},{"category_slug":"security","title_ar":"أنظمة الأمن والحماية المادية","title_en":"Physical Security Systems"},{"category_slug":"security","title_ar":"هندسة السلامة وإدارة المخاطر","title_en":"Safety Engineering & Risk Management"},{"category_slug":"ads","title_ar":"التسويق الرقمي والحملات الإعلانية","title_en":"Digital Marketing & Advertising Campaigns"},{"category_slug":"ads","title_ar":"الاستراتيجية التسويقية وإدارة العلامات التجارية","title_en":"Marketing Strategy & Brand Management"},{"category_slug":"ads","title_ar":"إدارة المحتوى والاتصال المؤسسي","title_en":"Content Management & Corporate Communications"},{"category_slug":"design","title_ar":"تصميم الهوية البصرية والمواد الإبداعية","title_en":"Brand Identity & Creative Design"},{"category_slug":"design","title_ar":"تصميم واجهات وتجارب المستخدم","title_en":"UI & UX Design"},{"category_slug":"consult","title_ar":"استشارات التحول الرقمي","title_en":"Digital Transformation Consulting"},{"category_slug":"consult","title_ar":"استشارات تقنية المعلومات وأمن المعلومات","title_en":"IT & Information Security Consulting"}]'::jsonb;
BEGIN
  IF v_owner_email LIKE 'REPLACE_WITH_%' THEN
    RAISE EXCEPTION 'Replace the owner email placeholder with a verified B2ME Auth login before running';
  END IF;
  SELECT u.id INTO v_owner FROM auth.users u
   WHERE lower(u.email)=lower(v_owner_email)
     AND u.email_confirmed_at IS NOT NULL
   LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Verified B2ME Auth owner account was not found';
  END IF;
  SELECT id INTO v_primary_category FROM public.categories
   WHERE slug='tech' AND is_active IS TRUE;
  IF v_primary_category IS NULL THEN
    RAISE EXCEPTION 'The live B2ME tech category is missing or inactive';
  END IF;
  SELECT c.id,c.owner_id INTO v_company,v_existing_owner
    FROM public.companies c WHERE c.slug='asas-360' LIMIT 1;
  IF v_company IS NOT NULL AND v_existing_owner IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'ASAS company already belongs to a different owner: aborting';
  END IF;
  IF v_company IS NULL THEN
    INSERT INTO public.companies
      (owner_id,provider_type,slug,name_ar,name_en,country_code,city,
       primary_category_id,description_ar,description_en,public_email,public_phone,website)
    VALUES
      (v_owner,'company','asas-360','ASAS 360°','ASAS 360°','IQ','بغداد',
       v_primary_category,'ASAS 360° شركة عراقية تقدم حلولاً متكاملة للأعمال تشمل التكنولوجيا والأتمتة، أمن المعلومات والأمن المادي والسلامة الهندسية، تطوير المواقع والتطبيقات وأنظمة الأعمال، الدعاية والتصميم والاستشارات.','ASAS 360° is an Iraqi integrated business solutions provider offering technology and automation, cybersecurity, physical security and safety engineering, websites, apps and business systems, marketing, creative design and consulting.',
       'info@asas360.com','+9647817262800','https://asas360.com')
    RETURNING id INTO v_company;
  END IF;
  FOR v_service IN
    SELECT * FROM jsonb_to_recordset(v_services)
    AS s(category_slug text,title_ar text,title_en text)
  LOOP
    SELECT id INTO v_category FROM public.categories
      WHERE slug=v_service.category_slug AND is_active IS TRUE;
    IF v_category IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive B2ME category: %',v_service.category_slug;
    END IF;
    INSERT INTO public.listings(company_id,category_id,listing_type,title_ar,title_en)
    SELECT v_company,v_category,'service',v_service.title_ar,v_service.title_en
    WHERE NOT EXISTS(
      SELECT 1 FROM public.listings l
      WHERE l.company_id=v_company AND l.category_id=v_category
        AND l.title_ar=v_service.title_ar
    );
  END LOOP;
  RAISE NOTICE 'ASAS 360° provider % and services prepared for B2ME admin review',v_company;
END;
$asas_seed$;

-- Validation queries, to be run after completing the admin moderation workflow:
-- select id,slug,status,primary_category_id from public.companies where slug='asas-360';
-- select c.slug,l.title_ar,l.status from public.listings l
-- join public.categories c on c.id=l.category_id
-- join public.companies p on p.id=l.company_id where p.slug='asas-360';
