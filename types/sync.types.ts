// Data synchronization types
import { BaseSyncResult } from "./base.types";

import { PlatformType } from ".";

// Sync status enum
export enum SyncStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  SUCCESS = "success",
  FAILED = "failed",
  PARTIAL = "partial",
}

// Sync result interface
export interface SyncResult extends BaseSyncResult {
  platform: PlatformType;
  syncType: "full" | "incremental";
  recordsProcessed?: number;
  recordsFailed?: number;
  duration?: number;
  details?: {
    campaigns?: number;
    adGroups?: number;
    ads?: number;
    keywords?: number;
  };
}

// Sync job interface
export interface SyncJob {
  id: string;
  teamId: string;
  platform: PlatformType;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: SyncResult;
}

// Sync options interface
export interface SyncOptions {
  platforms?: PlatformType[];
  syncType?: "full" | "incremental";
  dateRange?: {
    from: Date;
    to: Date;
  };
  forceSync?: boolean;
}
