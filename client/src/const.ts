export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate Auth.js login URL
export const getLoginUrl = () => {
  return "/api/auth/signin/google";
};
