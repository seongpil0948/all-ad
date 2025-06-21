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

export default async function CronJobsPage() {
  const cronJobs = await getCronJobs();

  const columns = [
    { key: "jobname", label: "Job Name" },
    { key: "schedule", label: "Schedule" },
    { key: "active", label: "Active" },
    { key: "last_run", label: "Last Run" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cron Jobs Management</h1>
        <p className="text-default-500">Monitor and manage scheduled tasks</p>
      </div>

      <Card>
        <CardHeader>
          <SectionHeader title="Scheduled Jobs" />
        </CardHeader>
        <CardBody>
          <Table aria-label="Cron jobs table">
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
                              {item.active ? "Active" : "Inactive"}
                            </Chip>
                          </TableCell>
                        );
                      case "last_run":
                        return (
                          <TableCell>
                            {item.start_time
                              ? new Date(item.start_time).toLocaleString(
                                  "ko-KR",
                                )
                              : "Never"}
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
                                {item.status}
                              </Chip>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        );
                      case "duration":
                        return (
                          <TableCell>
                            {item.duration
                              ? `${Math.round(item.duration.seconds || 0)}s`
                              : "-"}
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
                                Run Now
                              </Button>
                            </form>
                          </TableCell>
                        );
                      default:
                        return <TableCell>-</TableCell>;
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
          <SectionHeader title="Migration from Vercel Cron" />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="prose prose-sm">
            <h4>Migration Steps Completed:</h4>
            <ol>
              <li>Created Supabase Edge Functions for each cron job</li>
              <li>Set up pg_cron schedules in Supabase</li>
              <li>Removed Vercel cron configuration</li>
            </ol>

            <h4>Cron Schedule Reference:</h4>
            <ul>
              <li>
                <code>refresh-oauth-tokens</code>: Every hour at minute 0
              </li>
              <li>
                <code>google-ads-sync-hourly</code>: Every hour at minute 0
              </li>
              <li>
                <code>google-ads-sync-full-daily</code>: Every day at 2:00 AM
              </li>
              <li>
                <code>cleanup-cron-history</code>: Every day at 3:00 AM
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
