import { getSupabaseClient } from "./client-singleton";

// Export the singleton client getter as createClient for backward compatibility
export const createClient = getSupabaseClient;
