
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.apply_templates_on_join() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recalc_season_record() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.chat_messages_protect_identity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
