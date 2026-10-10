"""Static checks for B2ME Supabase access model (NOT a live database test)."""
from pathlib import Path
s = (Path(__file__).resolve().parents[1] / "supabase/migrations/0001_initial_schema.sql").read_text(encoding="utf-8").lower()
required = (
  "enable row level security",
  'create policy "read_own_profile"',
  'create policy "read_active_or_owned_providers"',
  'create policy "create_own_draft_offer"',
  'create policy "submit_own_inquiry_to_active_provider"',
  'create policy "read_own_favorites"',
  'create policy "read_own_notifications"',
  "revoke all on public.profiles",
  "create function public.submit_offer_for_review(offer_id uuid)",
  "revoke all on function public.create_profile_for_user()",
  "grant execute on function public.submit_offer_for_review(uuid) to authenticated;",
  "new.status := 'pending';",
  "new.status := 'pending_review';",
  "lower(requester_email)=lower(auth.jwt()->>'email')",
)
for item in required:
    assert item in s, "Missing security contract: " + item
assert s.count("enable row level security") == 9
assert not any("on public.provider_subscriptions" in ln for ln in s.splitlines() if ln.strip().startswith(("grant update", "grant insert", "grant delete")))
assert not any("on public.featured_placements" in ln for ln in s.splitlines() if ln.strip().startswith(("grant update", "grant insert", "grant delete")))
print("B2ME schema: static RLS/permission contract checks passed.")
