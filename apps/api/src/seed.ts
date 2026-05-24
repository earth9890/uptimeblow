import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./db/schema/users.ts";
import { eq } from "drizzle-orm";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  const email = "harishs@bsf.io";
  const name = "Harish";
  const password = "Harish@123";

  // Check if user exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`User ${email} already exists (id: ${existing[0]!.id})`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        emailVerified: true,
        plan: "free",
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    console.log(`Created user: ${user!.name} (${user!.email}) — id: ${user!.id}`);
  }

  await pool.end();
}

seed().catch(console.error);
