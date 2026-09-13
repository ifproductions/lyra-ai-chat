ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'pt' CHECK (locale IN ('pt','en','es','fr','de')),
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','system')),
  ADD COLUMN IF NOT EXISTS performance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS history_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS privacy_analytics boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_avatar_path text;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);