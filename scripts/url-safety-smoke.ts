import { validateExternalHttpsUrl } from "../lib/url-safety";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const cases = [
    ["http://example.com", "https_required"],
    ["https://localhost", "private_host"],
    ["https://127.0.0.1", "private_host"],
    ["https://169.254.169.254", "private_host"],
    ["https://192.0.2.1", "private_host"],
    ["https://[::1]", "private_host"],
    ["https://user:pass@example.com", "credentials_forbidden"],
    ["https://example.com:8443", "port_forbidden"],
  ] as const;
  for (const [value, reason] of cases) {
    const result = await validateExternalHttpsUrl(value);
    expect(!result.ok && result.reason === reason, `${value} was not rejected as ${reason}`);
  }
  console.log("URL safety smoke passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
