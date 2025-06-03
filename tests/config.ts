import dotenv from "dotenv";

// Load environment variables from .env file
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
