import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { classes } from "../db/schema";

/** Shared by every teacher-dashboard route that operates on a specific
 * class, so ownership is checked the same way everywhere. */
export async function getOwnedClass(classId: number, teacherId: number) {
  const classRow = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
  });
  if (!classRow || classRow.teacherId !== teacherId) return null;
  return classRow;
}
