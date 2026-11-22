/** Unit tests for the Step 3 public pages: route exposure, content rules, and the contact form logic. */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { features } from "@/config/features";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { buildMailto, CONTACT_TOPICS, parseContactEmail, validateContact } from "@/lib/contact";
import { isPublicPath, PUBLIC_PATHS, safeRedirectPath } from "@/lib/routes";

describe("route exposure", () => {
  it("makes exactly the marketing and auth pages public", () => {
    assert.deepEqual([...PUBLIC_PATHS].sort(), ["/", "/about", "/contact", "/features", "/login", "/register"]);
    for (const p of PUBLIC_PATHS) assert.equal(isPublicPath(p), true, p);
  });

  /** Page routes found on disk under a route group, e.g. "(app)" -> ["/dashboard", "/history", ...]. */
  const routesIn = (group: string) => {
    const root = path.join(process.cwd(), "src/app", group);
    return readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "page.tsx")))
      .map((d) => `/${d.name}`);
  };

  it("keeps every real signed-in page protected by default", () => {
    const appRoutes = routesIn("(app)");
    assert.ok(appRoutes.length >= 8, `expected the signed-in pages, found ${appRoutes.join(", ")}`);
    for (const route of appRoutes) assert.equal(isPublicPath(route), false, `${route} must require a session`);
  });

  it("registers every public page folder, and every listed path has a page", () => {
    // A page added under (public) or (auth) but missing from PUBLIC_PATHS would silently redirect visitors to /login.
    const onDisk = [...routesIn("(public)"), ...routesIn("(auth)"), "/"].sort();
    assert.deepEqual(onDisk, [...PUBLIC_PATHS].sort());
    assert.ok(existsSync(path.join(process.cwd(), "src/app/(public)/page.tsx")), "home page exists");
  });

  it("does not let look-alike or nested paths through", () => {
    for (const p of ["/about/team", "/aboutx", "/features/../dashboard", "/dashboard/", "/contact/x", "/api/anything", "//about"]) {
      assert.equal(isPublicPath(p), false, p);
    }
  });

  it("treats a trailing slash as the same page", () => {
    assert.equal(isPublicPath("/about/"), true);
    assert.equal(isPublicPath("/login/"), true);
    assert.equal(isPublicPath("/dashboard/"), false);
  });

  it("post-login redirects still refuse auth pages and off-site targets", () => {
    for (const bad of ["/login", "/login/", "/register", "https://evil.example", "//evil.example"]) {
      assert.equal(safeRedirectPath(bad), "/dashboard", bad);
    }
    assert.equal(safeRedirectPath("/resume-analyzer"), "/resume-analyzer");
  });
});

describe("feature content", () => {
  it("has unique ids and titles and enough substance on each feature", () => {
    assert.equal(new Set(features.map((f) => f.id)).size, features.length);
    assert.equal(new Set(features.map((f) => f.title)).size, features.length);
    for (const f of features) {
      assert.ok(f.summary.length > 20, f.id);
      assert.ok(f.points.length >= 3, f.id);
      assert.ok(["available", "coming-soon"].includes(f.status), f.id);
    }
  });

  it("keeps the honesty caveats the product promises", () => {
    const analyzer = features.find((f) => f.id === "resume-analyzer");
    const roles = features.find((f) => f.id === "job-roles");
    assert.match(analyzer?.note ?? "", /estimate/i);
    assert.match(analyzer?.note ?? "", /not a real ATS/i);
    assert.match(roles?.note ?? "", /not show or verify live job/i);
  });

  it("never claims a feature is available that the build plan has not shipped", () => {
    // Update this expectation deliberately when a feature ships and its status is flipped.
    assert.ok(features.every((f) => f.status === "coming-soon"));
  });
});

describe("contact address configuration", () => {
  it("accepts one valid address and normalises it", () => {
    assert.equal(parseContactEmail("  Hello@Example.TEST "), "hello@example.test");
  });

  it("rejects missing, malformed and multi-recipient values", () => {
    for (const bad of [undefined, "", "   ", "not-an-email", "a@b", "a@b.co, c@d.co", "a@b.co;c@d.co", "a@b.co?cc=x@y.co", "<a@b.co>"]) {
      assert.equal(parseContactEmail(bad), null, String(bad));
    }
  });
});

describe("contact form validation", () => {
  const good = { name: "  Ada   Lovelace ", email: " ADA@Example.COM ", topic: CONTACT_TOPICS[0], message: "  Hello, I have a question.  " };

  it("normalises valid input", () => {
    const r = validateContact(good);
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.data.name, "Ada Lovelace");
      assert.equal(r.data.email, "ada@example.com");
      assert.equal(r.data.message, "Hello, I have a question.");
    }
  });

  it("reports a message per invalid field", () => {
    const r = validateContact({ name: " ", email: "nope", topic: "Spam", message: "short" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["email", "message", "name", "topic"]);
  });

  it("enforces length limits", () => {
    assert.equal(validateContact({ ...good, message: "x".repeat(1001) }).ok, false);
    assert.equal(validateContact({ ...good, message: "x".repeat(1000) }).ok, true);
    assert.equal(validateContact({ ...good, name: "n".repeat(81) }).ok, false);
  });

  it("rejects a topic that is not in the list", () => {
    assert.equal(validateContact({ ...good, topic: "Sell me crypto" }).ok, false);
  });
});

describe("mailto builder", () => {
  const data = { name: "Ada", email: "ada@example.com", topic: CONTACT_TOPICS[1], message: "The page crashed when I clicked Save." };

  it("builds a link with exactly a subject and a body", () => {
    const url = new URL(buildMailto("hello@example.test", data));
    assert.equal(url.protocol, "mailto:");
    assert.equal(decodeURIComponent(url.pathname), "hello@example.test");
    assert.deepEqual([...url.searchParams.keys()], ["subject", "body"]);
    assert.equal(url.searchParams.get("subject"), "[CareerAI] Bug report");
    assert.match(url.searchParams.get("body") ?? "", /Ada \(ada@example\.com\)/);
  });

  it("cannot be used to add recipients or headers", () => {
    const evil = validateContact({
      name: "Mallory\r\nBcc: victim@example.test",
      email: "m@example.test",
      topic: CONTACT_TOPICS[0],
      message: "Hi there friends&cc=victim@example.test&bcc=victim@example.test\r\nBcc: victim@example.test",
    });
    assert.ok(evil.ok);
    if (!evil.ok) return;
    const link = buildMailto("hello@example.test", evil.data);
    const url = new URL(link);
    assert.deepEqual([...url.searchParams.keys()], ["subject", "body"], "no extra parameters appeared");
    assert.equal(url.searchParams.get("subject"), "[CareerAI] General question", "subject is not influenced by visitor text");
    assert.ok(!/[\r\n]/.test(link), "the raw link contains no line breaks");
    assert.ok(!link.includes("&cc="), "visitor text is percent-encoded, so '&cc=' cannot start a parameter");
    assert.ok(url.searchParams.get("body")?.includes("&cc=victim@example.test"), "the text is preserved literally inside the body");
  });
});
