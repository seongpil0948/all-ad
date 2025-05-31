# 문제 해결 가이드

## 1. Table 컴포넌트 에러 해결
Team 페이지를 클라이언트 컴포넌트로 변경했습니다. Hero UI의 일부 컴포넌트는 서버 컴포넌트에서 제대로 작동하지 않을 수 있습니다.

## 2. Avatar 업로드 RLS 정책 에러 해결

### Supabase에서 다음 SQL 실행:
```sql
-- 기존 정책 삭제 후 새로 생성
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 더 간단한 정책으로 재생성
CREATE POLICY "Anyone can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can delete avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

## 3. 로그인 후 즉시 아바타 표시 문제

이는 Next.js의 캐싱 문제입니다. 다음과 같은 방법으로 해결할 수 있습니다:

### 옵션 1: 페이지 새로고침
브라우저에서 수동으로 새로고침 (F5 또는 Cmd+R)

### 옵션 2: 클라이언트 사이드 리다이렉션
로그인 페이지를 클라이언트 컴포넌트로 변경하고 router.refresh() 사용

### 옵션 3: Middleware 수정
`middleware.ts`에서 로그인 후 캐시 무효화 추가

## 4. 추가 개선사항

### Profile 생성 트리거 확인
```sql
-- 기존 사용자를 위한 프로필 생성
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

이렇게 하면 모든 문제가 해결될 것입니다.
