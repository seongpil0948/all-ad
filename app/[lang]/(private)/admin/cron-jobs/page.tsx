import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { FaSync, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import { createClient } from "@/utils/supabase/server";
import { SectionHeader } from "@/components/common";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

async function getCronJobs() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_cron_job_status").select("*");

  if (error) {
    console.error("Error fetching cron jobs:", error);

    return [];
  }

  return data || [];
}

async function triggerCronJob(jobName: string) {
  "use server";

  const supabase = await createClient();

  // Manually trigger the cron job by calling the edge function
  const functionMap: Record<string, string> = {
    "refresh-oauth-tokens": "refresh-tokens",
    "google-ads-sync-hourly": "google-ads-sync",
    "google-ads-sync-full-daily": "google-ads-sync-full",
  };

  const functionName = functionMap[jobName];

  if (!functionName) {
    throw new Error(`Unknown job name: ${jobName}`);
  }

  // Call the edge function directly
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { trigger: "manual" },
  });

  if (error) {
    throw error;
  }

  return data;
}

export default async function CronJobsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (lang as Locale) || "en";
  const dict = await getDictionary(locale);
  const cronJobs = await getCronJobs();

  const JOB_REFRESH_TOKENS = "refresh-oauth-tokens" as const;
  const JOB_GOOGLE_SYNC_HOURLY = "google-ads-sync-hourly" as const;
  const JOB_GOOGLE_SYNC_FULL_DAILY = "google-ads-sync-full-daily" as const;
  const JOB_CLEANUP_HISTORY = "cleanup-cron-history" as const;

  const columns = [
    { key: "jobname", label: dict.admin.cron.table.jobName },
    { key: "schedule", label: dict.admin.cron.table.schedule },
    { key: "active", label: dict.common.active },
    { key: "last_run", label: dict.admin.cron.table.lastRun },
    { key: "status", label: dict.admin.cron.table.status },
    { key: "duration", label: dict.admin.cron.table.duration },
    { key: "actions", label: dict.common.actions },
  ];

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
          <Table aria-label={dict.admin.cron.scheduledJobs}>
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody items={cronJobs}>
              {(item) => (
                <TableRow key={item.jobid}>
                  {(columnKey) => {
                    switch (columnKey) {
                      case "jobname":
                        return <TableCell>{item.jobname}</TableCell>;
                      case "schedule":
                        return (
                          <TableCell className="font-mono text-small">
                            {item.schedule}
                          </TableCell>
                        );
                      case "active":
                        return (
                          <TableCell>
                            <Chip
                              color={item.active ? "success" : "default"}
                              size="sm"
                              variant="flat"
                            >
                              {item.active
                                ? dict.common.active
                                : dict.common.inactive}
                            </Chip>
                          </TableCell>
                        );
                      case "last_run":
                        return (
                          <TableCell>
                            {item.start_time
                              ? new Date(item.start_time).toLocaleString(locale)
                              : dict.common.never}
                          </TableCell>
                        );
                      case "status":
                        return (
                          <TableCell>
                            {item.status ? (
                              <Chip
                                color={
                                  item.status === "succeeded"
                                    ? "success"
                                    : "danger"
                                }
                                size="sm"
                                startContent={
                                  item.status === "succeeded" ? (
                                    <FaCheckCircle />
                                  ) : (
                                    <FaTimesCircle />
                                  )
                                }
                                variant="flat"
                              >
                                {item.status === "succeeded"
                                  ? dict.common.success
                                  : dict.common.failed}
                              </Chip>
                            ) : (
                              dict.common.none
                            )}
                          </TableCell>
                        );
                      case "duration":
                        return (
                          <TableCell>
                            {item.duration
                              ? `${Math.round(item.duration.seconds || 0)}s`
                              : dict.common.none}
                          </TableCell>
                        );
                      case "actions":
                        return (
                          <TableCell>
                            <form
                              action={triggerCronJob.bind(null, item.jobname)}
                            >
                              <Button
                                color="primary"
                                size="sm"
                                startContent={<FaSync />}
                                type="submit"
                                variant="flat"
                              >
                                {dict.admin.cron.runNow}
                              </Button>
                            </form>
                          </TableCell>
                        );
                      default:
                        return <TableCell>{dict.common.none}</TableCell>;
                    }
                  }}
                </TableRow>
              )}
            </TableBody>
          </Table>
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
