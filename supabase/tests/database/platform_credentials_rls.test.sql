begin;

-- Install pgTAP extension
create extension if not exists pgtap with schema extensions;

-- Start test plan
select plan(8);

-- Setup test data
-- Create test users
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
    ('44444444-4444-4444-4444-444444444444', 'platform_user1@test.com', now(), '{"full_name": "Platform User 1"}'::jsonb),
    ('55555555-5555-5555-5555-555555555555', 'platform_user2@test.com', now(), '{"full_name": "Platform User 2"}'::jsonb);

-- Wait for triggers to complete
select pg_sleep(0.1);

-- Get team IDs
create temp table test_teams as
select 
    t1.id as team1_id,
    t2.id as team2_id
from 
    (select id from teams where created_by = '44444444-4444-4444-4444-444444444444' limit 1) t1,
    (select id from teams where created_by = '55555555-5555-5555-5555-555555555555' limit 1) t2;

-- Add platform credentials for team 1
insert into platform_credentials (team_id, platform, account_id, account_name, access_token, created_by)
select 
    team1_id, 
    'google_ads', 
    'test-account-1', 
    'Test Google Account', 
    'test-token-1',
    '44444444-4444-4444-4444-444444444444'
from test_teams;

insert into platform_credentials (team_id, platform, account_id, account_name, access_token, created_by)
select 
    team1_id, 
    'facebook_ads', 
    'test-account-2', 
    'Test Facebook Account', 
    'test-token-2',
    '44444444-4444-4444-4444-444444444444'
from test_teams;

-- Add platform credentials for team 2
insert into platform_credentials (team_id, platform, account_id, account_name, access_token, created_by)
select 
    team2_id, 
    'google_ads', 
    'test-account-3', 
    'Test Google Account 2', 
    'test-token-3',
    '55555555-5555-5555-5555-555555555555'
from test_teams;

-- Test 1: User can see their team's credentials
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select results_eq(
    'select count(*)::int from platform_credentials',
    ARRAY[2],
    'User 1 should see 2 platform credentials'
);

-- Test 2: User cannot see other team's credentials
select is_empty(
    'select * from platform_credentials where account_id = ''test-account-3''',
    'User 1 cannot see User 2 team credentials'
);

-- Test 3: Master can create new credentials
select lives_ok(
    $$
    insert into platform_credentials (team_id, platform, account_id, account_name, access_token, created_by)
    select 
        team1_id, 
        'kakao_ads', 
        'test-kakao-1', 
        'Test Kakao Account', 
        'test-kakao-token',
        '44444444-4444-4444-4444-444444444444'
    from test_teams
    $$,
    'Master can create new credentials'
);

-- Test 4: Viewer cannot create credentials
-- Add user 2 as viewer to team 1
insert into team_members (team_id, user_id, role)
select team1_id, '55555555-5555-5555-5555-555555555555', 'viewer'
from test_teams;

set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select throws_ok(
    $$
    insert into platform_credentials (team_id, platform, account_id, account_name, access_token, created_by)
    select 
        team1_id, 
        'naver_ads', 
        'test-naver-1', 
        'Test Naver Account', 
        'test-naver-token',
        '55555555-5555-5555-5555-555555555555'
    from test_teams
    $$,
    '42501',
    'new row violates row-level security policy for table "platform_credentials"',
    'Viewer cannot create credentials'
);

-- Test 5: Team mate can manage credentials
-- Update user 2 role to team_mate
update team_members 
set role = 'team_mate'
where user_id = '55555555-5555-5555-5555-555555555555'
and team_id in (select team1_id from test_teams);

select lives_ok(
    $$
    insert into platform_credentials (team_id, platform, account_id, account_name, access_token, created_by)
    select 
        team1_id, 
        'amazon_ads', 
        'test-amazon-1', 
        'Test Amazon Account', 
        'test-amazon-token',
        '55555555-5555-5555-5555-555555555555'
    from test_teams
    $$,
    'Team mate can create credentials'
);

-- Test 6: Team mate can update credentials
select lives_ok(
    'update platform_credentials set account_name = ''Updated Name'' where account_id = ''test-amazon-1''',
    'Team mate can update credentials'
);

-- Test 7: User cannot access credentials after being removed from team
delete from team_members 
where user_id = '55555555-5555-5555-5555-555555555555'
and team_id in (select team1_id from test_teams);

select is_empty(
    'select * from platform_credentials where account_id = ''test-account-1''',
    'User cannot see credentials after removal from team'
);

-- Test 8: Test credential status update
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select lives_ok(
    'update platform_credentials set status = ''expired'' where account_id = ''test-account-1''',
    'Master can update credential status'
);

-- Finish tests
select * from finish();

rollback;