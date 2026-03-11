/* eslint-disable no-console */
import { syncMockEbayProducts } from "../src/lib/ebay";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log("[syncProducts] starting", { dryRun });

  const result = await syncMockEbayProducts({ dryRun });
  console.log("[syncProducts] result", result);

  if (result.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("[syncProducts] fatal", e);
  process.exitCode = 1;
});

