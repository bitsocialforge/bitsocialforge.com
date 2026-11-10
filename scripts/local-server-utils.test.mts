import assert from "node:assert/strict";
import test from "node:test";
import { getPortlessPublicUrl } from "./local-server-utils.mts";

test("getPortlessPublicUrl keeps a non-default proxy port in the URL", () => {
  assert.equal(
    getPortlessPublicUrl("bitsocialforge", "1355"),
    "https://bitsocialforge.localhost:1355",
  );
  assert.equal(
    getPortlessPublicUrl("feature.bitsocialforge", "443"),
    "https://feature.bitsocialforge.localhost",
  );
});
