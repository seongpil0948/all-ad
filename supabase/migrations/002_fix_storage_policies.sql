-- Fix storage policies for avatars bucket

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create more permissive storage policies for authenticated users
-- Public read access
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Authenticated users can update their own avatars
CREATE POLICY "Authenticated users can update avatars" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'avatars');

-- Authenticated users can delete their own avatars  
CREATE POLICY "Authenticated users can delete avatars" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars');

-- Ensure avatars bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Fix profiles table update policy to handle null values
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
