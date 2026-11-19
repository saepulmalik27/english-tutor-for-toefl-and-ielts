import { test } from "node:test";
import assert from "node:assert/strict";
import { planTopUp } from "./stock.ts";

test("only kinds below the target get generated, and only the shortfall", () => {
  assert.deepEqual(planTopUp({ reading_s3: 2, speaking_p2: 5, writing_t1: 9 }), { reading_s3: 3, speaking_p2: 0, writing_t1: 0 });
});

test("an empty bank fills to the target", () => {
  assert.deepEqual(planTopUp({ reading_s3: 0 }, 5), { reading_s3: 5 });
});
