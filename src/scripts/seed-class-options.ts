import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { subjects } from "../db/schema/index.js";
import { user } from "../db/schema/auth.js";

async function seedClassOptions() {
  await db
    .insert(subjects)
    .values([
      {
        departmentId: 1,
        name: "Database Systems",
        code: "CS202",
        description: "Relational modeling and SQL fundamentals",
      },
      {
        departmentId: 1,
        name: "Computer Networks",
        code: "CS203",
        description: "Protocols, routing, and network layers",
      },
    ])
    .onConflictDoNothing({ target: subjects.code });

  await db
    .insert(user)
    .values([
      {
        id: "teach_seed_anna",
        name: "Anna Smith",
        email: "anna.smith.teacher@classroom.local",
        role: "teacher",
      },
      {
        id: "teach_seed_michael",
        name: "Michael Lee",
        email: "michael.lee.teacher@classroom.local",
        role: "teacher",
      },
    ])
    .onConflictDoNothing({ target: user.email });

  const [subjectCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(subjects);

  const [teacherCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(user)
    .where(sql`${user.role} = 'teacher'`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        subjectsTotal: subjectCount?.count ?? 0,
        teachersTotal: teacherCount?.count ?? 0,
      },
      null,
      2,
    ),
  );
}

seedClassOptions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed class options:", error);
    process.exit(1);
  });
