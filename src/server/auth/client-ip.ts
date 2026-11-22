import { isIP } from "node:net";

/**
 * Client IP resolution that is safe by default.
 *
 * Forwarding headers (X-Forwarded-For and friends) are plain text that ANY client can send.
 * They are only trustworthy when a proxy YOU control rewrites or appends to them. So the
 * app never reads them unless the operator opts in with TRUST_PROXY:
 *
 *   TRUST_PROXY unset / "none"  Ignore all forwarding headers. Client IP is unknown (null).
 *   TRUST_PROXY=vercel          Deployed on Vercel, which sets the client IP itself.
 *   TRUST_PROXY=<N> (1, 2, ...) N proxies that you control append to X-Forwarded-For
 *                               (e.g. nginx = 1). The Nth entry from the RIGHT is the client.
 *
 * Entries to the left of that point were supplied by the client and are never used.
 * This file is pure (no Next.js imports) so it can be unit-tested directly.
 */

export type TrustMode = { kind: "none" } | { kind: "vercel" } | { kind: "hops"; hops: number };

export interface HeaderReader {
  get(name: string): string | null;
}

/** Returns null for an invalid value so the caller can warn and fall back to "none". */
export function parseTrustProxy(value: string | undefined): TrustMode | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "" || v === "none" || v === "false" || v === "0") return { kind: "none" };
  if (v === "vercel") return { kind: "vercel" };
  if (/^[1-9]\d?$/.test(v)) return { kind: "hops", hops: Number(v) };
  return null;
}

let cachedMode: TrustMode | undefined;

export function getTrustMode(): TrustMode {
  if (cachedMode) return cachedMode;
  const raw = process.env.TRUST_PROXY;
  const parsed = parseTrustProxy(raw);
  if (!parsed) {
    console.warn(`TRUST_PROXY has an invalid value; ignoring it. Use "none", "vercel", or a number such as 1.`);
  }
  cachedMode = parsed ?? { kind: "none" };
  if (cachedMode.kind === "none" && process.env.NODE_ENV === "production") {
    console.warn(
      "TRUST_PROXY is not set: client IPs are unknown, so login throttling is per email only. " +
        "Set TRUST_PROXY=vercel on Vercel, or the number of trusted proxies elsewhere. See README.",
    );
  }
  return cachedMode;
}

/** For tests only. */
export function resetTrustModeCache() {
  cachedMode = undefined;
}

export function resolveClientIp(headers: HeaderReader, mode: TrustMode): string | null {
  switch (mode.kind) {
    case "none":
      return null;
    case "vercel": {
      const value = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
      if (!value) return null;
      // Vercel supplies a single address. If a list ever appears, the LAST entry is the one
      // added closest to us; entries on the left could have come from the client.
      const parts = splitList(value);
      return normalizeIp(parts[parts.length - 1] ?? "");
    }
    case "hops": {
      const value = headers.get("x-forwarded-for");
      if (!value) return null;
      const parts = splitList(value);
      // Fewer entries than trusted proxies means the header is not shaped as configured: do not guess.
      if (parts.length < mode.hops) return null;
      return normalizeIp(parts[parts.length - mode.hops]);
    }
  }
}

function splitList(value: string): string[] {
  return value.split(",").map((p) => p.trim()).filter(Boolean);
}

/**
 * Returns a canonical bucket key, or null if the text is not an IP address.
 * - strips ports and [brackets]; unwraps IPv4-mapped IPv6 (::ffff:1.2.3.4)
 * - IPv6 is reduced to its /64 prefix, because one subscriber usually controls a whole /64
 *   and could otherwise rotate through billions of addresses to dodge a per-address limit.
 */
export function normalizeIp(raw: string): string | null {
  let ip = raw.trim();
  const bracketed = ip.match(/^\[(.+)\](?::\d+)?$/);
  if (bracketed) ip = bracketed[1];
  else {
    const v4port = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (v4port) ip = v4port[1];
  }
  ip = ip.replace(/%.*$/, "").toLowerCase(); // drop IPv6 zone id

  const family = isIP(ip);
  if (family === 4) return ip;
  if (family !== 6) return null;

  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped && isIP(mapped[1]) === 4) return mapped[1];

  const groups = expandIpv6(ip);
  if (!groups) return null;
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}

function expandIpv6(ip: string): string[] | null {
  // Convert an embedded IPv4 tail (a.b.c.d) into two hex groups.
  const tail = ip.match(/^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (tail) {
    const [a, b, c, d] = tail.slice(2).map(Number);
    if ([a, b, c, d].some((n) => n > 255)) return null;
    ip = `${tail[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 ? (halves[1] ? halves[1].split(":") : []) : [];
  if (halves.length === 1) return head.length === 8 ? head : null;
  const fill = 8 - head.length - rest.length;
  if (fill < 1) return null;
  return [...head, ...Array<string>(fill).fill("0"), ...rest];
}
