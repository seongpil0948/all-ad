import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.test file if it exists, otherwise from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
// Fall back to .env if .env.test doesn't exist
dotenv.config();

// You might want to validate the required environment variables
const testUserId = process.env.TEST_USER_ID;
const testUserPw = process.env.TEST_USER_PASSWORD;

if (!testUserId || !testUserPw) {
  console.warn(
    "Warning: TEST_USER_ID and/or TEST_USER_PASSWORD environment variables are not set",
  );
}

export const testConfig = {
  recordPath: "test-results/records",
  saveRecord: true,
  testUserId,
  testUserPw,
  statePath: "tests/asset/storageState.json",
};

export default testConfig;
