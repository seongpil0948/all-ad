import { NextRequest, NextResponse } from "next/server";

// import { createServiceClient } from "@/utils/supabase/service"; // Uncomment when needed for actual SQL execution

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - you should enhance this for production
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const supabase = createServiceClient(); // Uncomment when needed for actual SQL execution

    // Drop existing policies
    const dropPoliciesSQL = [
      // Drop teams policies
      `DROP POLICY IF EXISTS "teams_all_authenticated" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_select" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_insert" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_update" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_delete" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_select_own_teams" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_select_as_member" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_insert_own" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_update_own" ON public.teams`,
      `DROP POLICY IF EXISTS "teams_delete_own" ON public.teams`,

      // Drop team_members policies
      `DROP POLICY IF EXISTS "team_members_all_authenticated" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_select" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_insert" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_update" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_delete" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_select_own" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_select_as_master" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_insert_as_master" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_update_as_master" ON public.team_members`,
      `DROP POLICY IF EXISTS "team_members_delete_as_master" ON public.team_members`,
    ];

    // Note: In production, these SQL commands should be executed directly
    // in Supabase SQL editor or via migration files
    // This is just for generating the SQL statements

    // Create new policies
    const createPoliciesSQL = [
      // Teams policies
      {
        name: "teams_select_own_teams",
        table: "teams",
        sql: `CREATE POLICY "teams_select_own_teams" ON public.teams
              FOR SELECT USING (master_user_id = auth.uid())`,
      },
      {
        name: "teams_select_as_member",
        table: "teams",
        sql: `CREATE POLICY "teams_select_as_member" ON public.teams
              FOR SELECT USING (
                id IN (
                  SELECT team_id FROM public.team_members 
                  WHERE user_id = auth.uid()
                )
              )`,
      },
      {
        name: "teams_insert_own",
        table: "teams",
        sql: `CREATE POLICY "teams_insert_own" ON public.teams
              FOR INSERT WITH CHECK (master_user_id = auth.uid())`,
      },
      {
        name: "teams_update_own",
        table: "teams",
        sql: `CREATE POLICY "teams_update_own" ON public.teams
              FOR UPDATE USING (master_user_id = auth.uid())`,
      },
      {
        name: "teams_delete_own",
        table: "teams",
        sql: `CREATE POLICY "teams_delete_own" ON public.teams
              FOR DELETE USING (master_user_id = auth.uid())`,
      },

      // Team members policies
      {
        name: "team_members_select_own",
        table: "team_members",
        sql: `CREATE POLICY "team_members_select_own" ON public.team_members
              FOR SELECT USING (user_id = auth.uid())`,
      },
      {
        name: "team_members_select_as_master",
        table: "team_members",
        sql: `CREATE POLICY "team_members_select_as_master" ON public.team_members
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM public.teams 
                  WHERE teams.id = team_members.team_id 
                  AND teams.master_user_id = auth.uid()
                )
              )`,
      },
      {
        name: "team_members_insert_as_master",
        table: "team_members",
        sql: `CREATE POLICY "team_members_insert_as_master" ON public.team_members
              FOR INSERT WITH CHECK (
                EXISTS (
                  SELECT 1 FROM public.teams 
                  WHERE teams.id = team_members.team_id 
                  AND teams.master_user_id = auth.uid()
                )
              )`,
      },
      {
        name: "team_members_update_as_master",
        table: "team_members",
        sql: `CREATE POLICY "team_members_update_as_master" ON public.team_members
              FOR UPDATE USING (
                EXISTS (
                  SELECT 1 FROM public.teams 
                  WHERE teams.id = team_members.team_id 
                  AND teams.master_user_id = auth.uid()
                )
              )`,
      },
      {
        name: "team_members_delete_as_master",
        table: "team_members",
        sql: `CREATE POLICY "team_members_delete_as_master" ON public.team_members
              FOR DELETE USING (
                EXISTS (
                  SELECT 1 FROM public.teams 
                  WHERE teams.id = team_members.team_id 
                  AND teams.master_user_id = auth.uid()
                )
              )`,
      },
    ];

    // Since we can't execute raw SQL via Supabase client, we'll return the migration SQL
    return NextResponse.json({
      message: "RLS fix migration SQL generated",
      migration: {
        dropPolicies: dropPoliciesSQL,
        createPolicies: createPoliciesSQL.map((p) => p.sql),
      },
      instructions:
        "Please run this migration directly in your Supabase SQL editor or via Supabase CLI",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate RLS fix",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
