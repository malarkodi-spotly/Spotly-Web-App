import "../server/env-loader";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function inspect() {
  try {
    console.log("Checking database connection...");

    // Check if table bookings exists and what columns it has
    const result = await db.execute(sql`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings'
      ORDER BY column_name;
    `);

    console.log("Bookings Columns in Database:");
    console.log(JSON.stringify(result, null, 2));

    // Check for orphan worker profiles
    const orphans = await db.execute(sql`
      SELECT wp.id, wp.user_id 
      FROM worker_profiles wp 
      LEFT JOIN users u ON wp.user_id = u.id 
      WHERE u.id IS NULL;
    `);
    console.log("Orphan Worker Profiles (no matching user):");
    console.log(JSON.stringify(orphans, null, 2));

    // Check count of users and worker profiles
    const counts = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM users) as users_count,
        (SELECT count(*) FROM worker_profiles) as workers_count,
        (SELECT count(*) FROM bookings) as bookings_count,
        (SELECT count(*) FROM notifications) as notifications_count;
    `);
    console.log("Record Counts:");
    console.log(JSON.stringify(counts, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error inspecting database:", error);
    process.exit(1);
  }
}

inspect();
