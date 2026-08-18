export function getClientIp(request: Request): string | null {
  const testClient = process.env.NODE_ENV !== "production" ? request.headers.get("x-test-client")?.trim() : "";
  if (testClient) return testClient;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || null;
}

export function getUserAgent(request: Request): string | null {
  const value = request.headers.get("user-agent")?.trim();
  return value ? value.slice(0, 300) : null;
}

const BROWSERS: Array<[RegExp, string]> = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Chrome\//, "Chrome"],
  [/CriOS\//, "Chrome"],
  [/FxiOS\//, "Firefox"],
  [/Firefox\//, "Firefox"],
  [/Safari\//, "Safari"],
];

const PLATFORMS: Array<[RegExp, string]> = [
  [/Windows/, "Windows"],
  [/Mac OS X/, "macOS"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Linux/, "Linux"],
];

export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "جهاز غير معروف";
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] || "متصفح غير معروف";
  const platform = PLATFORMS.find(([pattern]) => pattern.test(userAgent))?.[1] || "نظام غير معروف";
  return `${browser} على ${platform}`;
}
