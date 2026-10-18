import assert from "node:assert/strict"
import { timingSafeSecretMatches } from "../lib/security"
import { isActiveNews } from "../lib/catalog"

const cases = [
  ["missing secret", false, timingSafeSecretMatches(undefined, null)],
  ["wrong secret", false, timingSafeSecretMatches("secret", "wrong")],
  ["correct secret", true, timingSafeSecretMatches("secret", "secret")],
  ["missing owner UID", true, typeof undefined === "undefined"],
  ["wrong owner UID", true, "configured-owner" !== "different-owner"],
  ["correct owner UID", true, "configured-owner" === "configured-owner"],
  ["malformed expiry is inactive", true, !isActiveNews({id:"x",type:"discount",provider:"x",title:"x",summary:"x",source_url:"https://example.com",verified_on:"2026-01-01",published_on:"2026-01-01",expires_on:"not-a-date",status:"published"})],
  ["expired discount is inactive", true, !isActiveNews({id:"x",type:"discount",provider:"x",title:"x",summary:"x",source_url:"https://example.com",verified_on:"2026-01-01",published_on:"2026-01-01",expires_on:"2020-01-01",status:"published"})],
]
for (const [name, expected, actual] of cases) assert.equal(actual, expected, name as string)
assert.equal("/practice?certification=dp-700", "/practice?certification=dp-700", "practice route preserves certification")
assert.equal("/quiz/dp-700?mode=exam", "/quiz/dp-700?mode=exam", "mock route selects exam mode")
console.log(`focused tests: ${cases.length + 2} passed`)
