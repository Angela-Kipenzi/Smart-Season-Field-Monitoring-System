import { Router, type IRouter } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import {
  db,
  fieldsTable,
  fieldUpdatesTable,
  usersTable,
  type FieldUpdateRow,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { ALLOWED_STAGES } from "./fields";

const router: IRouter = Router();

function serializeUpdate(
  u: FieldUpdateRow,
  authorName: string,
): {
  id: number;
  fieldId: number;
  authorId: number;
  authorName: string;
  previousStage: string | null;
  newStage: string | null;
  note: string;
  createdAt: string;
} {
  return {
    id: u.id,
    fieldId: u.fieldId,
    authorId: u.authorId,
    authorName,
    previousStage: u.previousStage ?? null,
    newStage: u.newStage ?? null,
    note: u.note,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get(
  "/fields/:id/updates",
  requireAuth,
  async (req, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const me = req.currentUser!;
    const [field] = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.id, id));
    if (!field) {
      res.status(404).json({ error: "Field not found" });
      return;
    }
    if (me.role !== "admin" && field.assignedAgentId !== me.id) {
      res.status(403).json({ error: "Not authorized for this field" });
      return;
    }

    const updates = await db
      .select()
      .from(fieldUpdatesTable)
      .where(eq(fieldUpdatesTable.fieldId, id))
      .orderBy(desc(fieldUpdatesTable.createdAt));

    const authorIds = Array.from(new Set(updates.map((u) => u.authorId)));
    const authors =
      authorIds.length > 0
        ? await db
            .select()
            .from(usersTable)
            .where(inArray(usersTable.id, authorIds))
        : [];
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));
    res.json(
      updates.map((u) =>
        serializeUpdate(u, authorMap.get(u.authorId) ?? "Unknown"),
      ),
    );
  },
);

router.post(
  "/fields/:id/updates",
  requireAuth,
  async (req, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const me = req.currentUser!;
    const [field] = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.id, id));
    if (!field) {
      res.status(404).json({ error: "Field not found" });
      return;
    }
    if (me.role !== "admin" && field.assignedAgentId !== me.id) {
      res.status(403).json({ error: "Not authorized for this field" });
      return;
    }
    const body = req.body ?? {};
    if (!body.note || typeof body.note !== "string") {
      res.status(400).json({ error: "Note is required" });
      return;
    }
    if (body.newStage && !ALLOWED_STAGES.includes(body.newStage)) {
      res.status(400).json({ error: "Invalid stage" });
      return;
    }

    const previousStage = field.stage;
    const newStage = body.newStage ?? null;

    const [created] = await db
      .insert(fieldUpdatesTable)
      .values({
        fieldId: id,
        authorId: me.id,
        previousStage,
        newStage,
        note: body.note,
      })
      .returning();

    if (newStage && newStage !== previousStage) {
      await db
        .update(fieldsTable)
        .set({ stage: newStage })
        .where(eq(fieldsTable.id, id));
    }

    if (!created) {
      res.status(500).json({ error: "Failed to create update" });
      return;
    }
    res.status(201).json(serializeUpdate(created, me.name));
  },
);

router.get("/updates/recent", requireAuth, async (req, res): Promise<void> => {
  const me = req.currentUser!;

  const visibleFields =
    me.role === "admin"
      ? await db.select().from(fieldsTable)
      : await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.assignedAgentId, me.id));

  if (visibleFields.length === 0) {
    res.json([]);
    return;
  }
  const fieldIds = visibleFields.map((f) => f.id);
  const fieldNameMap = new Map(visibleFields.map((f) => [f.id, f.name]));

  const updates = await db
    .select()
    .from(fieldUpdatesTable)
    .where(inArray(fieldUpdatesTable.fieldId, fieldIds))
    .orderBy(desc(fieldUpdatesTable.createdAt))
    .limit(20);

  const authorIds = Array.from(new Set(updates.map((u) => u.authorId)));
  const authors =
    authorIds.length > 0
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, authorIds))
      : [];
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  res.json(
    updates.map((u) => ({
      id: u.id,
      fieldId: u.fieldId,
      fieldName: fieldNameMap.get(u.fieldId) ?? "Field",
      authorId: u.authorId,
      authorName: authorMap.get(u.authorId) ?? "Unknown",
      previousStage: u.previousStage ?? null,
      newStage: u.newStage ?? null,
      note: u.note,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

export default router;
