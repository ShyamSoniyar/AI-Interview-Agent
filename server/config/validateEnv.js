// Fails fast on misconfiguration instead of letting the app boot into a broken state.
// Runs before anything else in index.js.

const errors = [];
const warnings = [];

const require_ = (name, hint) => {
  if (!process.env[name]?.trim()) {
    errors.push(`${name} is missing. ${hint}`);
    return false;
  }
  return true;
};

const validateEnv = () => {
  const isProd = process.env.NODE_ENV === "production";
  const clientUrl = process.env.CLIENT_URL?.trim();

  // --- Always required ---
  require_("MONGODB_URL", "The server cannot reach the database without it.");
  require_("JWT_SECRET", "Sessions cannot be signed without it.");
  require_("OPENROUTER_API_KEY", "Every AI feature will fail without it.");

  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length < 32) {
    const msg = `JWT_SECRET is only ${secret.length} chars. Use 32+ random bytes: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`;
    isProd ? errors.push(msg) : warnings.push(msg);
  }

  // --- Firebase (auth is dead without it) ---
  const firebaseVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const missingFirebase = firebaseVars.filter((v) => !process.env[v]?.trim());
  if (missingFirebase.length) {
    const msg = `Firebase service account incomplete (missing: ${missingFirebase.join(", ")}). Sign-in will return 503.`;
    isProd ? errors.push(msg) : warnings.push(msg);
  }

  // --- The cookie trap ---
  // Cross-site cookies need secure + sameSite=none, which auth.controller.js only
  // sets when NODE_ENV === "production". An https client on a non-prod server means
  // the session cookie is silently never sent back.
  if (clientUrl?.startsWith("https://") && !isProd) {
    errors.push(
      `CLIENT_URL is https (${clientUrl}) but NODE_ENV is "${process.env.NODE_ENV || "unset"}". ` +
        `Auth cookies would be sameSite=lax and never sent cross-site — sign-in would appear to work, ` +
        `then every request would 401. Set NODE_ENV=production.`,
    );
  }

  if (isProd && !clientUrl) {
    errors.push(
      "NODE_ENV=production but CLIENT_URL is unset. CORS would fall back to localhost and block your deployed frontend.",
    );
  }

  if (isProd && clientUrl?.includes("localhost")) {
    warnings.push(
      `NODE_ENV=production but CLIENT_URL points at localhost (${clientUrl}). Is that intended?`,
    );
  }

  // CORS compares origins exactly — a trailing slash never matches
  if (clientUrl?.endsWith("/")) {
    errors.push(
      `CLIENT_URL has a trailing slash (${clientUrl}). CORS matches the origin exactly, so every request would be blocked. Remove it.`,
    );
  }

  const billing = process.env.BILLING_ENABLED?.trim();
  if (billing && !["true", "false"].includes(billing)) {
    warnings.push(
      `BILLING_ENABLED="${billing}" is neither "true" nor "false"; treating as false (credits unlimited).`,
    );
  }

  // --- Report ---
  if (warnings.length) {
    console.warn("\n⚠  Config warnings:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn("");
  }

  if (errors.length) {
    console.error("\n❌  Cannot start — fix these environment problems:\n");
    errors.forEach((e) => console.error(`   - ${e}\n`));
    process.exit(1);
  }

  console.log(
    `Config OK (NODE_ENV=${process.env.NODE_ENV || "development"}, client=${clientUrl || "http://localhost:5173"})`,
  );
};

export default validateEnv;
