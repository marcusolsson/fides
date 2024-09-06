/* eslint-disable no-console */
export const debugLog =
  process.env.FIDES_PRIVACY_CENTER__DEBUG === "true"
    ? (...args: unknown[]) => console.log("\x1b[34m%s\x1b[0m", "=>", ...args)
    : () => {};
