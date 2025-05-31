# 설치 가이드

## 필요한 패키지 설치

프로젝트에서 차트 기능을 사용하기 위해 다음 패키지를 설치해야 합니다:

```bash
pnpm add echarts
```

## Supabase 설정

1. Supabase 대시보드에서 SQL Editor로 이동합니다.
2. `supabase/migrations/001_create_profiles.sql` 파일의 내용을 실행합니다.
3. 이렇게 하면 다음이 생성됩니다:
   - `profiles` 테이블
   - `avatars` 스토리지 버킷
   - 필요한 RLS 정책들
   - 새 사용자 생성 시 자동으로 프로필을 생성하는 트리거

## 환경 변수

`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인하세요:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 구현된 기능

1. **인증 기반 Navbar**
   - 로그인 상태에 따라 자동으로 UI 변경
   - 사용자 아바타 표시
   - 드롭다운 메뉴

2. **프로필 관리**
   - 프로필 사진 업로드/삭제
   - 이름 수정
   - 실시간 업데이트

3. **페이지 구조**
   - `/dashboard` - 대시보드
   - `/profile` - 프로필 관리
   - `/settings` - 설정
   - `/team` - 팀 관리
   - `/analytics` - 분석 (ECharts 사용)

4. **보안**
   - Row Level Security (RLS) 적용
   - 사용자는 자신의 데이터만 접근 가능
