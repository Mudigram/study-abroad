import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BUCKET_NAME = "document_vault";

function loadEnv() {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      }),
  );
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();

if (listError) {
  console.error(`Failed to list buckets: ${listError.message}`);
  process.exit(1);
}

const existing = buckets?.find((bucket) => bucket.name === BUCKET_NAME);

if (existing) {
  if (existing.public) {
    console.error(`Bucket "${BUCKET_NAME}" exists but is public. It must be private.`);
    process.exit(1);
  }

  console.log(`Bucket "${BUCKET_NAME}" already exists (private).`);
  process.exit(0);
}

const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
  public: false,
});

if (createError) {
  console.error(`Failed to create bucket: ${createError.message}`);
  process.exit(1);
}

console.log(`Created private bucket "${BUCKET_NAME}".`);
