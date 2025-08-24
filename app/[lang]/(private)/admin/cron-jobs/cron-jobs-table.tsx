"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useMemo } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FaSync, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import { triggerCronJobAction } from "./actions";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export type CronJobRow = {
  jobid: string | number;
  jobname: string;
  schedule: string;
  active: boolean;
  start_time: string | null;
  status: string | null;
  duration: { seconds?: number | null } | null;
};

interface CronJobsTableProps {
  cronJobs: CronJobRow[];
  dict: Awaited<ReturnType<typeof getDictionary>>;
  locale: Locale;
}

export function CronJobsTable({ cronJobs, dict, locale }: CronJobsTableProps) {
  const columns = [
    { key: "jobname", label: dict.admin.cron.table.jobName },
    { key: "schedule", label: dict.admin.cron.table.schedule },
    { key: "active", label: dict.common.active },
    { key: "last_run", label: dict.admin.cron.table.lastRun },
    { key: "status", label: dict.admin.cron.table.status },
    { key: "duration", label: dict.admin.cron.table.duration },
    { key: "actions", label: dict.common.actions },
  ] as const;

  // HeroUI/React Aria dynamic Table collections require each data item to have a stable key/id
  // BEFORE the row render function runs. Providing only <TableRow key={...}> is not enough because
  // the collection builder determines keys from the items array itself. We derive a string key from jobid.
  const items = useMemo(
    () =>
      cronJobs.map((j) => ({
        ...j,
        key: String(j.jobid),
      })),
    [cronJobs],
  );

  return (
    <Table aria-label={dict.admin.cron.scheduledJobs} isStriped removeWrapper>
      <TableHeader columns={[...columns] as { key: string; label: string }[]}>
        {(col: { key: string; label: string }) => (
          <TableColumn key={col.key}>{col.label}</TableColumn>
        )}
      </TableHeader>
      <TableBody items={items} emptyContent={dict.common.none}>
        {(item: CronJobRow & { key: string }) => (
          <TableRow key={item.key}>
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
                            item.status === "succeeded" ? "success" : "danger"
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
                      <form action={triggerCronJobAction}>
                        <input
                          type="hidden"
                          name="jobName"
                          value={item.jobname}
                        />
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
                  return <TableCell>-</TableCell>;
              }
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
