// App-wide constants. Kept out of App.jsx so components don't import from it —
// that created a circular dependency and broke React Fast Refresh.

export const ServerUrl =
  import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// Billing not live yet — credits are unlimited. Must match BILLING_ENABLED in server/.env
export const BILLING_ENABLED = false;
