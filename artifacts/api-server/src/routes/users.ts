import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  };
}

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  res.json({ user: serialize(req.currentUser!) });
});

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db.select().from(usersTable).orderBy(usersTable.id);
    res.json(rows.map(serialize));
  },
);

router.get(
  "/users/agents",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "field_agent"))
      .orderBy(usersTable.name);
    res.json(rows.map(serialize));
  },
);

router.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const role = req.body?.role;
    if (role !== "admin" && role !== "field_agent") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ role })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(serialize(updated));
  },
);

export default router;
