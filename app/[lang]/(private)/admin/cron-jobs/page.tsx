import { Card, CardBody, CardHeader } from "@heroui/card";
import { Suspense } from "react";
// Table UI moved to client component in cron-jobs-table.tsx

import { createClient } from "@/utils/supabase/server";
import { CronJobsTable } from "./cron-jobs-table";
import { SectionHeader } from "@/components/common";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

async function getCronJobs() {
  const supabase = await createClient();

  // RPC already returns the rows; no further select() needed.
  const { data, error } = await supabase.rpc("get_cron_job_status");

  if (error) {
    console.error("Error fetching cron jobs:", error);

    return [];
  }

  return data || [];
}

// triggerCronJob moved to dedicated server action in actions.ts

// Client table component (marked implicitly by using hooks if added later). For now it's pure but separated.

export default async function CronJobsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (lang as Locale) || "en";
  const dict = await getDictionary(locale);
  const rawCronJobs = await getCronJobs();

  // Transform Supabase RPC return shape -> CronJobsTable expected shape.
  // RPC get_cron_job_status returns: job_id, job_name, last_run_time, last_run_status, schedule, active, ...
  // Table expects: jobid, jobname, schedule, active, start_time, status, duration.
  interface RpcCronJobRow {
    job_id: number | string;
    job_name: string;
    schedule: string;
    active: boolean;
    last_run_time: string | null;
    last_run_status: string | null;
  }

  const cronJobs = (rawCronJobs as RpcCronJobRow[]).map((r) => ({
    jobid: r.job_id,
    jobname: r.job_name,
    schedule: r.schedule,
    active: r.active,
    start_time: r.last_run_time ?? null,
    status: r.last_run_status ?? null,
    duration: null, // Not provided by this RPC
  }));

  const JOB_REFRESH_TOKENS = "refresh-oauth-tokens" as const;
  const JOB_GOOGLE_SYNC_HOURLY = "google-ads-sync-hourly" as const;
  const JOB_GOOGLE_SYNC_FULL_DAILY = "google-ads-sync-full-daily" as const;
  const JOB_CLEANUP_HISTORY = "cleanup-cron-history" as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{dict.admin.cron.title}</h1>
        <p className="text-default-500">{dict.admin.cron.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <SectionHeader title={dict.admin.cron.scheduledJobs} />
        </CardHeader>
        <CardBody>
          <Suspense fallback={<div>{dict.common.loading}...</div>}>
            <CronJobsTable cronJobs={cronJobs} dict={dict} locale={locale} />
          </Suspense>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader title={dict.admin.cron.migration.title} />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="prose prose-sm">
            <h4>{dict.admin.cron.migration.stepsTitle}</h4>
            <ol>
              <li>{dict.admin.cron.migration.step1}</li>
              <li>{dict.admin.cron.migration.step2}</li>
              <li>{dict.admin.cron.migration.step3}</li>
            </ol>

            <h4>{dict.admin.cron.migration.scheduleTitle}</h4>
            <ul>
              <li>
                <code>{JOB_REFRESH_TOKENS}</code>:{" "}
                {dict.admin.cron.migration.schedule1}
              </li>
              <li>
                <code>{JOB_GOOGLE_SYNC_HOURLY}</code>:{" "}
                {dict.admin.cron.migration.schedule2}
              </li>
              <li>
                <code>{JOB_GOOGLE_SYNC_FULL_DAILY}</code>:{" "}
                {dict.admin.cron.migration.schedule3}
              </li>
              <li>
                <code>{JOB_CLEANUP_HISTORY}</code>:{" "}
                {dict.admin.cron.migration.schedule4}
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
