// Load variables from a local .env file if one exists (Node 20.12+).
// On hosting platforms the variables are set in their dashboard instead.
try {
  process.loadEnvFile();
} catch {
  // no .env file — that's fine
}
