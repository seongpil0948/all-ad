import "server-only";

import { initializeTokenRefreshService } from "@/lib/auth/token-refresh-service";
import log from "@/utils/logger";

// Initialize token refresh service on server startup
export function initializeServices() {
  try {
    // Initialize token refresh service in production
    initializeTokenRefreshService();

    log.info("All services initialized successfully");
  } catch (error) {
    log.error("Failed to initialize services", error);
    // Don't throw error to prevent app startup failure
  }
}

// Call initialization immediately in production
if (process.env.NODE_ENV === "production") {
  initializeServices();
}
