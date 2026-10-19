import postgres from "postgres";
import path from "path";
import dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV || 'production'; // default to production since it was loaded by default

// Load variables in the same way env-loader does
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}.local`) });
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  const sql = postgres(url);
  
  try {
    console.log("Running migration query...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_location jsonb;`;
    console.log("Success! Column last_known_location added to users table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

main();
