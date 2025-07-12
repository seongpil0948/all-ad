import log from "@/utils/logger";
import { withAuth } from "@/utils/server-action-wrapper";
import { getUserTeamInfo } from "@/utils/team-helpers";
import { PlatformSyncService } from "@/services/platform-sync.service";
import { PlatformServiceFactory } from "@/services/platforms/platform-service-factory";
import { PlatformDatabaseService } from "@/services/platform-database.service";

export class DataSyncService {
  async syncAllPlatformData() {
    return withAuth(async ({ user, supabase }) => {
      const teamInfo = await getUserTeamInfo(supabase, user.id);

      if (!teamInfo) {
        return { error: "Team not found." };
      }

      try {
        const platformServiceFactory = new PlatformServiceFactory();
        const simpleLogger = {
          debug: (message: string) => log.debug(message),
          info: (message: string) => log.info(message),
          warn: (message: string) => log.warn(message),
          error: (message: string) => log.error(message),
        };
        const platformDatabaseService = new PlatformDatabaseService(
          supabase,
          simpleLogger,
        );
        const platformSyncService = new PlatformSyncService(
          platformServiceFactory,
          platformDatabaseService,
          simpleLogger,
        );

        const result = await platformSyncService.syncAllPlatforms(
          teamInfo.teamId,
          user.id,
        );

        if (!result.success) {
          log.error("Platform sync failed", { results: result.results });
          // Provide a more detailed error message to the user
          const failedPlatforms = Object.entries(result.results)
            .filter(([, res]) => !res.success)
            .map(
              ([platform, res]) =>
                `${platform}: ${res.error || "Unknown error"}`,
            )
            .join(", ");

          return { error: `Failed to sync some platforms: ${failedPlatforms}` };
        }

        return { success: true, data: result };
      } catch (error) {
        log.error("An unexpected error occurred during platform sync", {
          error,
        });

        return { error: "An unexpected error occurred during platform sync." };
      }
    });
  }
}
