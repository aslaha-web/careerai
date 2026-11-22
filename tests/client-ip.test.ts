/**
 * Pure unit tests for client IP resolution (no database).
 * The point of this module: forwarding headers can be forged, so they must only be believed
 * when the operator has declared which proxy sets them (TRUST_PROXY).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeIp, parseTrustProxy, resolveClientIp, type TrustMode } from "@/server/auth/client-ip";
import { loginRules } from "@/server/auth/throttle";

const headers = (init: Record<string, string>) => ({
  get: (name: string) => init[name.toLowerCase()] ?? null,
});
const NONE: TrustMode = { kind: "none" };
const VERCEL: TrustMode = { kind: "vercel" };
const hops = (n: number): TrustMode => ({ kind: "hops", hops: n });

describe("parseTrustProxy", () => {
  it("accepts none, vercel and a proxy count; defaults to none", () => {
    assert.deepEqual(parseTrustProxy(undefined), NONE);
    assert.deepEqual(parseTrustProxy(""), NONE);
    assert.deepEqual(parseTrustProxy("none"), NONE);
    assert.deepEqual(parseTrustProxy(" Vercel "), VERCEL);
    assert.deepEqual(parseTrustProxy("1"), hops(1));
    assert.deepEqual(parseTrustProxy("3"), hops(3));
  });

  it("rejects anything else so a typo can never silently widen trust", () => {
    for (const bad of ["true", "yes", "all", "*", "-1", "100", "1.5", "cloudflare", "vercel,1"]) {
      assert.equal(parseTrustProxy(bad), null, bad);
    }
  });
});

describe("resolveClientIp: TRUST_PROXY=none (default)", () => {
  it("ignores every forwarding header, however plausible", () => {
    const spoof = headers({
      "x-forwarded-for": "6.6.6.6",
      "x-real-ip": "6.6.6.6",
      "x-vercel-forwarded-for": "6.6.6.6",
      forwarded: "for=6.6.6.6",
    });
    assert.equal(resolveClientIp(spoof, NONE), null);
  });

  it("rotating a forged header cannot produce different throttle keys", () => {
    const a = loginRules(resolveClientIp(headers({ "x-forwarded-for": "1.1.1.1" }), NONE), "victim@example.test");
    const b = loginRules(resolveClientIp(headers({ "x-forwarded-for": "2.2.2.2" }), NONE), "victim@example.test");
    assert.deepEqual(a.map((r) => r.key), b.map((r) => r.key));
  });
});

describe("resolveClientIp: TRUST_PROXY=vercel", () => {
  it("uses x-vercel-forwarded-for, falling back to x-forwarded-for", () => {
    assert.equal(resolveClientIp(headers({ "x-vercel-forwarded-for": "203.0.113.5", "x-forwarded-for": "9.9.9.9" }), VERCEL), "203.0.113.5");
    assert.equal(resolveClientIp(headers({ "x-forwarded-for": "203.0.113.6" }), VERCEL), "203.0.113.6");
    assert.equal(resolveClientIp(headers({}), VERCEL), null);
  });

  it("if a list ever appears, takes the last entry (closest to us), never the client-supplied first", () => {
    assert.equal(resolveClientIp(headers({ "x-vercel-forwarded-for": "6.6.6.6, 203.0.113.7" }), VERCEL), "203.0.113.7");
  });

  it("returns null for garbage rather than using it as a key", () => {
    assert.equal(resolveClientIp(headers({ "x-vercel-forwarded-for": "not-an-ip" }), VERCEL), null);
    assert.equal(resolveClientIp(headers({ "x-vercel-forwarded-for": "<script>" }), VERCEL), null);
  });
});

describe("resolveClientIp: TRUST_PROXY=<hops>", () => {
  it("one trusted proxy: takes the rightmost entry; forged left entries are ignored", () => {
    assert.equal(resolveClientIp(headers({ "x-forwarded-for": "198.51.100.1" }), hops(1)), "198.51.100.1");
    assert.equal(resolveClientIp(headers({ "x-forwarded-for": "6.6.6.6, 7.7.7.7, 198.51.100.1" }), hops(1)), "198.51.100.1");
  });

  it("two trusted proxies: takes the second from the right", () => {
    assert.equal(resolveClientIp(headers({ "x-forwarded-for": "6.6.6.6, 198.51.100.2, 10.0.0.9" }), hops(2)), "198.51.100.2");
  });

  it("returns null when the header has fewer entries than trusted proxies, or is missing", () => {
    assert.equal(resolveClientIp(headers({ "x-forwarded-for": "198.51.100.3" }), hops(2)), null);
    assert.equal(resolveClientIp(headers({}), hops(1)), null);
  });

  it("does not read x-real-ip or x-vercel-forwarded-for in this mode", () => {
    assert.equal(resolveClientIp(headers({ "x-real-ip": "6.6.6.6", "x-vercel-forwarded-for": "6.6.6.6" }), hops(1)), null);
  });
});

describe("normalizeIp", () => {
  it("accepts IPv4, strips ports and brackets, rejects junk", () => {
    assert.equal(normalizeIp("203.0.113.9"), "203.0.113.9");
    assert.equal(normalizeIp("203.0.113.9:51234"), "203.0.113.9");
    assert.equal(normalizeIp("[2001:db8::1]:443"), normalizeIp("2001:db8::1"));
    for (const bad of ["", "unknown", "999.1.1.1", "1.2.3", "1.2.3.4.5", "evil.example", "'; DROP TABLE users;--"]) {
      assert.equal(normalizeIp(bad), null, bad);
    }
  });

  it("unwraps IPv4-mapped IPv6 so both spellings share one bucket", () => {
    assert.equal(normalizeIp("::ffff:203.0.113.9"), "203.0.113.9");
  });

  it("buckets IPv6 by /64 so a subscriber cannot dodge limits by rotating addresses", () => {
    const a = normalizeIp("2001:db8:abcd:12:1111:2222:3333:4444");
    const b = normalizeIp("2001:db8:abcd:12:ffff:eeee:dddd:cccc");
    const c = normalizeIp("2001:db8:abcd:13::1");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a, "2001:db8:abcd:12::/64");
    assert.equal(normalizeIp("2001:0DB8::1"), normalizeIp("2001:db8:0:0:0:0:0:1"), "case and zero-compression do not matter");
  });
});
