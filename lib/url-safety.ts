import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 169 && parts[1] === 254 || parts[0] === 192 && parts[1] === 168 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 0;
}

function isPrivateIp(ip: string) {
  const normalized = ip.toLowerCase();
  if (net.isIPv4(normalized)) return isPrivateIpv4(normalized);
  if (!net.isIPv6(normalized)) return false;
  if (normalized.startsWith("::ffff:")) return isPrivateIpv4(normalized.slice("::ffff:".length));
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export async function validateExternalHttpsUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return { ok: false as const, reason: "invalid_url" }; }
  if (url.protocol !== "https:") return { ok: false as const, reason: "https_required" };
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return { ok: false as const, reason: "private_host" };
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses.length || addresses.some((address) => isPrivateIp(address.address))) return { ok: false as const, reason: "private_ip" };
  } catch { return { ok: false as const, reason: "dns_failure" }; }
  return { ok: true as const, url };
}

export async function checkExternalUrl(value: string) {
  const safe = await validateExternalHttpsUrl(value);
  if (!safe.ok) return { status: "UNREACHABLE" as const, statusCode: null, durationMs: 0, safeMessage: safe.reason };
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(safe.url, { method: "HEAD", redirect: "manual", signal: controller.signal, headers: { "user-agent": "Centralia-SaaS-Reachability/1.0" } });
    return { status: response.status >= 200 && response.status < 400 ? "REACHABLE" as const : "NEEDS_ATTENTION" as const, statusCode: response.status, durationMs: Date.now() - started, safeMessage: response.status >= 200 && response.status < 400 ? "external endpoint responded" : "external endpoint returned a non-success status" };
  } catch (error) {
    return { status: "UNREACHABLE" as const, statusCode: null, durationMs: Date.now() - started, safeMessage: error instanceof Error && error.name === "AbortError" ? "timeout" : "request_failed" };
  } finally { clearTimeout(timeout); }
}
