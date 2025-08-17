begin;

-- Install pgTAP extension
create extension if not exists pgtap with schema extensions;

-- Start test plan
select plan(12);

-- Setup test data
-- Create test users
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
    ('11111111-1111-1111-1111-111111111111', 'user1@test.com', now(), '{"full_name": "User 1"}'::jsonb),
    ('22222222-2222-2222-2222-222222222222', 'user2@test.com', now(), '{"full_name": "User 2"}'::jsonb),
    ('33333333-3333-3333-3333-333333333333', 'user3@test.com', now(), '{"full_name": "User 3"}'::jsonb);

-- Wait for triggers to complete
select pg_sleep(0.1);

-- Test 1: Users should have profiles created automatically
select ok(
    exists(select 1 from profiles where id = '11111111-1111-1111-1111-111111111111'),
    'User 1 profile should be created'
);

select ok(
    exists(select 1 from profiles where id = '22222222-2222-2222-2222-222222222222'),
    'User 2 profile should be created'
);

-- Test 2: Users should have teams created automatically
select ok(
    exists(select 1 from teams where created_by = '11111111-1111-1111-1111-111111111111'),
    'User 1 should have a team created'
);

-- Test 3: Users should be masters of their own teams
select ok(
    exists(
        select 1 from team_members 
        where user_id = '11111111-1111-1111-1111-111111111111' 
        and role = 'master'
    ),
    'User 1 should be master of their team'
);

-- Test 4: Test profile RLS - users can only see their own profile
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
    'select count(*)::int from profiles',
    ARRAY[1],
    'User 1 should only see their own profile'
);

-- Test 5: Test team RLS - users can only see teams they are members of
select results_eq(
    'select count(*)::int from teams',
    ARRAY[1],
    'User 1 should only see teams they are a member of'
);

-- Test 6: Switch to User 2
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select results_eq(
    'select count(*)::int from profiles',
    ARRAY[1],
    'User 2 should only see their own profile'
);

select results_eq(
    'select count(*)::int from teams',
    ARRAY[1],
    'User 2 should only see their own team'
);

-- Test 7: Users cannot see other users' teams
select is_empty(
    'select * from teams where created_by = ''11111111-1111-1111-1111-111111111111''',
    'User 2 cannot see User 1 team'
);

-- Test 8: Test team_members RLS
select is_empty(
    'select * from team_members where user_id = ''11111111-1111-1111-1111-111111111111''',
    'User 2 cannot see User 1 team membership'
);

-- Test 9: Test that users cannot update other users' profiles
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_ok(
    'update profiles set full_name = ''Hacked'' where id = ''11111111-1111-1111-1111-111111111111''',
    '42501',
    'new row violates row-level security policy for table "profiles"',
    'User 2 cannot update User 1 profile'
);

-- Test 10: Master can add team members
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
    $$
    insert into team_members (team_id, user_id, role)
    select t.id, '33333333-3333-3333-3333-333333333333', 'viewer'
    from teams t
    where t.created_by = '11111111-1111-1111-1111-111111111111'
    limit 1
    $$,
    'Master can add team members'
);

-- Finish tests
select * from finish();

rollback;