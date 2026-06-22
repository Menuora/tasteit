const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function check(path, expectedStatus = 200) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      resolve({ path, status: res.statusCode, ok: res.statusCode === expectedStatus });
    }).on("error", (err) => {
      resolve({ path, error: err.message, ok: false });
    });
  });
}

async function runSmokeTests() {
  console.log("Running smoke tests...");
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests = [
    { path: "/", expected: 200 },
    { path: "/admin", expected: 200 },
    { path: "/api/settings", expected: 200 },
    { path: "/api/gallery", expected: 200 },
    { path: "/api/admin/bookings", expected: 401 }, // Should block without login
    { path: "/api/admin/settings", expected: 401 }, // Should block without login
    { path: "/gallery.html", expected: 200 }
  ];

  const results = await Promise.all(tests.map((t) => check(t.path, t.expected)));

  let passed = 0;
  let failed = 0;

  results.forEach((r) => {
    if (r.ok) {
      console.log(`✓ ${r.path} - ${r.status}`);
      passed++;
    } else {
      console.log(`✗ ${r.path} - ${r.error || r.status} (expected ${r.expected || 200})`);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runSmokeTests();
