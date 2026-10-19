import "../server/env-loader";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fix() {
  try {
    console.log("Fixing booking cities...");
    
    // Fix bookings in Bengaluru/Karnataka that had city mistakenly set to Chennai
    const fixBlr = await db.execute(sql`
      UPDATE bookings
      SET city = 'Bengaluru'
      WHERE lower(city) IN ('chennai', 'madras')
        AND (
          lower(location) LIKE '%karnataka%'
          OR lower(location) LIKE '%bengaluru%'
          OR lower(location) LIKE '%bangalore%'
          OR location ~ '\m5[6-9][0-9]{4}\M'
        )
      RETURNING id, location, city;
    `);
    console.log("Corrected to Bengaluru:", fixBlr);

    // Fix bookings in Tamil Nadu that had city set to Bengaluru
    const fixTn = await db.execute(sql`
      UPDATE bookings
      SET city = 'Chennai'
      WHERE lower(city) IN ('bengaluru', 'bangalore', 'bangalore east')
        AND (
          lower(location) LIKE '%tamil%'
          OR lower(location) LIKE '%chennai%'
          OR lower(location) LIKE '%madras%'
          OR location ~ '\m6[0-4][0-9]{4}\M'
        )
      RETURNING id, location, city;
    `);
    console.log("Corrected to Chennai:", fixTn);

    process.exit(0);
  } catch (error) {
    console.error("Error fixing booking cities:", error);
    process.exit(1);
  }
}

fix();
