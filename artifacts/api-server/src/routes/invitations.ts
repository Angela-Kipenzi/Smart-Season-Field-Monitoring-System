import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, invitationsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const ALLOWED_ROLES = ["admin", "field_agent"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serialize(inv: typeof invitationsTable.$inferSelect) {
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    invitedById: inv.invitedById ?? null,
    invitedByName: inv.invitedByName ?? null,
    createdAt: inv.createdAt.toISOString(),
    acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
  };
}

router.get(
  "/invitations",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(invitationsTable)
      .orderBy(desc(invitationsTable.createdAt));
    res.json(rows.map(serialize));
  },
);

router.post(
  "/invitations",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const me = req.currentUser!;
    const rawEmail = String(req.body?.email ?? "").trim().toLowerCase();
    const role = String(req.body?.role ?? "field_agent");

    if (!EMAIL_RE.test(rawEmail)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!ALLOWED_ROLES.includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const [existing] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.email, rawEmail));

    if (existing) {
      if (existing.status === "pending") {
        res.status(409).json({
          error: "An invitation for this email is already pending.",
        });
        return;
      }
      // Re-issue: reset to pending with new role
      const [updated] = await db
        .update(invitationsTable)
        .set({
          role,
          status: "pending",
          invitedById: me.id,
          invitedByName: me.name,
          acceptedAt: null,
          createdAt: new Date(),
        })
        .where(eq(invitationsTable.id, existing.id))
        .returning();
      res.status(201).json(serialize(updated!));
      return;
    }

    const [created] = await db
      .insert(invitationsTable)
      .values({
        email: rawEmail,
        role,
        status: "pending",
        invitedById: me.id,
        invitedByName: me.name,
      })
      .returning();
    res.status(201).json(serialize(created!));
  },
);

router.delete(
  "/invitations/:id",
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
    const [deleted] = await db
      .delete(invitationsTable)
      .where(eq(invitationsTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
