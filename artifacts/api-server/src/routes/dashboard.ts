import { Router, type IRouter } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import {
  db,
  fieldsTable,
  fieldUpdatesTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { computeFieldStatus } from "../lib/fieldStatus";

const router: IRouter = Router();

const STAGES = ["planted", "growing", "ready", "harvested"] as const;
const STATUSES = ["active", "at_risk", "completed"] as const;

router.get(
  "/dashboard/summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = req.currentUser!;
    const fields =
      me.role === "admin"
        ? await db.select().from(fieldsTable)
        : await db
            .select()
            .from(fieldsTable)
            .where(eq(fieldsTable.assignedAgentId, me.id));

    const fieldIds = fields.map((f) => f.id);
    const fieldNameMap = new Map(fields.map((f) => [f.id, f.name]));

    // Compute last update per field
    const lastByField = new Map<number, Date>();
    if (fieldIds.length > 0) {
      const allUpdates = await db
        .select()
        .from(fieldUpdatesTable)
        .where(inArray(fieldUpdatesTable.fieldId, fieldIds));
      for (const u of allUpdates) {
        const prev = lastByField.get(u.fieldId);
        if (!prev || u.createdAt > prev) {
          lastByField.set(u.fieldId, u.createdAt);
        }
      }
    }

    const stageCounts = new Map<string, number>(STAGES.map((s) => [s, 0]));
    const statusCounts = new Map<string, number>(STATUSES.map((s) => [s, 0]));
    for (const f of fields) {
      stageCounts.set(f.stage, (stageCounts.get(f.stage) ?? 0) + 1);
      const status = computeFieldStatus(f, lastByField.get(f.id) ?? null);
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }

    // Recent updates (limit 10)
    const recentRows =
      fieldIds.length > 0
        ? await db
            .select()
            .from(fieldUpdatesTable)
            .where(inArray(fieldUpdatesTable.fieldId, fieldIds))
            .orderBy(desc(fieldUpdatesTable.createdAt))
            .limit(10)
        : [];

    const authorIds = Array.from(new Set(recentRows.map((r) => r.authorId)));
    const authors =
      authorIds.length > 0
        ? await db
            .select()
            .from(usersTable)
            .where(inArray(usersTable.id, authorIds))
        : [];
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));

    let totalAgents: number | null = null;
    if (me.role === "admin") {
      const agents = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "field_agent"));
      totalAgents = agents.length;
    }

    res.json({
      totalFields: fields.length,
      activeCount: statusCounts.get("active") ?? 0,
      atRiskCount: statusCounts.get("at_risk") ?? 0,
      completedCount: statusCounts.get("completed") ?? 0,
      totalAgents,
      stageBreakdown: STAGES.map((s) => ({
        stage: s,
        count: stageCounts.get(s) ?? 0,
      })),
      statusBreakdown: STATUSES.map((s) => ({
        status: s,
        count: statusCounts.get(s) ?? 0,
      })),
      recentUpdates: recentRows.map((u) => ({
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
    });
  },
);

export default router;
