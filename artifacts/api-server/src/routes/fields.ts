import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, max } from "drizzle-orm";
import {
  db,
  fieldsTable,
  fieldUpdatesTable,
  usersTable,
  type FieldRow,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import { computeFieldStatus } from "../lib/fieldStatus";

const router: IRouter = Router();

type SerializedField = ReturnType<typeof serializeField>;

function serializeField(
  field: FieldRow,
  lastUpdateAt: Date | null,
  agentName: string | null,
) {
  return {
    id: field.id,
    name: field.name,
    cropType: field.cropType,
    location: field.location ?? null,
    areaHectares: field.areaHectares ?? null,
    plantingDate:
      typeof field.plantingDate === "string"
        ? field.plantingDate
        : new Date(field.plantingDate).toISOString().slice(0, 10),
    expectedHarvestDate: field.expectedHarvestDate
      ? typeof field.expectedHarvestDate === "string"
        ? field.expectedHarvestDate
        : new Date(field.expectedHarvestDate).toISOString().slice(0, 10)
      : null,
    stage: field.stage,
    status: computeFieldStatus(field, lastUpdateAt),
    assignedAgentId: field.assignedAgentId ?? null,
    assignedAgentName: agentName,
    lastUpdateAt: lastUpdateAt ? lastUpdateAt.toISOString() : null,
    notes: field.notes ?? null,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  };
}

async function loadFieldsForUser(
  userId: number,
  role: string,
): Promise<SerializedField[]> {
  const rows =
    role === "admin"
      ? await db.select().from(fieldsTable).orderBy(desc(fieldsTable.createdAt))
      : await db
          .select()
          .from(fieldsTable)
          .where(eq(fieldsTable.assignedAgentId, userId))
          .orderBy(desc(fieldsTable.createdAt));

  if (rows.length === 0) return [];

  const fieldIds = rows.map((r) => r.id);
  const lastUpdates = await db
    .select({
      fieldId: fieldUpdatesTable.fieldId,
      lastAt: max(fieldUpdatesTable.createdAt),
    })
    .from(fieldUpdatesTable)
    .where(inArray(fieldUpdatesTable.fieldId, fieldIds))
    .groupBy(fieldUpdatesTable.fieldId);
  const lastByField = new Map<number, Date>();
  for (const u of lastUpdates) {
    if (u.lastAt) lastByField.set(u.fieldId, new Date(u.lastAt));
  }

  const agentIds = Array.from(
    new Set(
      rows
        .map((r) => r.assignedAgentId)
        .filter((v): v is number => typeof v === "number"),
    ),
  );
  const agents =
    agentIds.length > 0
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, agentIds))
      : [];
  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  return rows.map((r) =>
    serializeField(
      r,
      lastByField.get(r.id) ?? null,
      r.assignedAgentId ? (agentMap.get(r.assignedAgentId) ?? null) : null,
    ),
  );
}

async function loadOneField(
  fieldId: number,
): Promise<SerializedField | null> {
  const [field] = await db
    .select()
    .from(fieldsTable)
    .where(eq(fieldsTable.id, fieldId));
  if (!field) return null;
  const [last] = await db
    .select({ lastAt: max(fieldUpdatesTable.createdAt) })
    .from(fieldUpdatesTable)
    .where(eq(fieldUpdatesTable.fieldId, fieldId));
  let agentName: string | null = null;
  if (field.assignedAgentId) {
    const [agent] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, field.assignedAgentId));
    agentName = agent?.name ?? null;
  }
  return serializeField(
    field,
    last?.lastAt ? new Date(last.lastAt) : null,
    agentName,
  );
}

const ALLOWED_STAGES = ["planted", "growing", "ready", "harvested"];

router.get("/fields", requireAuth, async (req, res): Promise<void> => {
  const me = req.currentUser!;
  const list = await loadFieldsForUser(me.id, me.role);
  res.json(list);
});

router.post(
  "/fields",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const body = req.body ?? {};
    if (!body.name || !body.cropType || !body.plantingDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (body.stage && !ALLOWED_STAGES.includes(body.stage)) {
      res.status(400).json({ error: "Invalid stage" });
      return;
    }
    const [created] = await db
      .insert(fieldsTable)
      .values({
        name: body.name,
        cropType: body.cropType,
        location: body.location ?? null,
        areaHectares:
          body.areaHectares == null ? null : Number(body.areaHectares),
        plantingDate: body.plantingDate,
        expectedHarvestDate: body.expectedHarvestDate ?? null,
        stage: body.stage ?? "planted",
        assignedAgentId:
          body.assignedAgentId == null ? null : Number(body.assignedAgentId),
        notes: body.notes ?? null,
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Failed to create field" });
      return;
    }
    const serialized = await loadOneField(created.id);
    res.status(201).json(serialized);
  },
);

router.get("/fields/:id", requireAuth, async (req, res): Promise<void> => {
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
  const serialized = await loadOneField(id);
  res.json(serialized);
});

router.patch("/fields/:id", requireAuth, async (req, res): Promise<void> => {
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
  const body = req.body ?? {};
  if (body.stage && !ALLOWED_STAGES.includes(body.stage)) {
    res.status(400).json({ error: "Invalid stage" });
    return;
  }

  const isAdmin = me.role === "admin";
  const isAssignedAgent = field.assignedAgentId === me.id;
  if (!isAdmin && !isAssignedAgent) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  // Agents may only update the stage and notes
  const patch: Record<string, unknown> = {};
  if (isAdmin) {
    if (body.name !== undefined) patch.name = body.name;
    if (body.cropType !== undefined) patch.cropType = body.cropType;
    if (body.location !== undefined) patch.location = body.location;
    if (body.areaHectares !== undefined)
      patch.areaHectares =
        body.areaHectares == null ? null : Number(body.areaHectares);
    if (body.plantingDate !== undefined) patch.plantingDate = body.plantingDate;
    if (body.expectedHarvestDate !== undefined)
      patch.expectedHarvestDate = body.expectedHarvestDate;
    if (body.assignedAgentId !== undefined)
      patch.assignedAgentId =
        body.assignedAgentId == null ? null : Number(body.assignedAgentId);
  }
  if (body.stage !== undefined) patch.stage = body.stage;
  if (body.notes !== undefined) patch.notes = body.notes;

  if (Object.keys(patch).length === 0) {
    const serialized = await loadOneField(id);
    res.json(serialized);
    return;
  }

  await db.update(fieldsTable).set(patch).where(eq(fieldsTable.id, id));
  const serialized = await loadOneField(id);
  res.json(serialized);
});

router.delete(
  "/fields/:id",
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
    await db
      .delete(fieldUpdatesTable)
      .where(eq(fieldUpdatesTable.fieldId, id));
    const [deleted] = await db
      .delete(fieldsTable)
      .where(eq(fieldsTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Field not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export { loadFieldsForUser, loadOneField, serializeField, ALLOWED_STAGES };
export default router;
