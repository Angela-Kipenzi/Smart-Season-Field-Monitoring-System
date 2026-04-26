import { Router, type IRouter } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db, fieldsTable, fieldUpdatesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { loadFieldsForUser } from "./fields";

const router: IRouter = Router();

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

router.get(
  "/exports/fields.csv",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = req.currentUser!;
    const fields = await loadFieldsForUser(me.id, me.role);
    const csv = toCsv(
      [
        "id",
        "name",
        "cropType",
        "location",
        "areaHectares",
        "plantingDate",
        "expectedHarvestDate",
        "stage",
        "status",
        "assignedAgentId",
        "assignedAgentName",
        "lastUpdateAt",
        "notes",
        "createdAt",
        "updatedAt",
      ],
      fields.map((f) => [
        f.id,
        f.name,
        f.cropType,
        f.location,
        f.areaHectares,
        f.plantingDate,
        f.expectedHarvestDate,
        f.stage,
        f.status,
        f.assignedAgentId,
        f.assignedAgentName,
        f.lastUpdateAt,
        f.notes,
        f.createdAt,
        f.updatedAt,
      ]),
    );
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="smartseason-fields-${stamp}.csv"`,
    );
    res.send(csv);
  },
);

router.get(
  "/exports/updates.csv",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = req.currentUser!;

    const visibleFields =
      me.role === "admin"
        ? await db.select().from(fieldsTable)
        : await db
            .select()
            .from(fieldsTable)
            .where(eq(fieldsTable.assignedAgentId, me.id));

    const fieldIds = visibleFields.map((f) => f.id);
    const fieldNameMap = new Map(visibleFields.map((f) => [f.id, f.name]));

    const updates =
      fieldIds.length > 0
        ? await db
            .select()
            .from(fieldUpdatesTable)
            .where(inArray(fieldUpdatesTable.fieldId, fieldIds))
            .orderBy(desc(fieldUpdatesTable.createdAt))
        : [];

    const authorIds = Array.from(new Set(updates.map((u) => u.authorId)));
    const authors =
      authorIds.length > 0
        ? await db
            .select()
            .from(usersTable)
            .where(inArray(usersTable.id, authorIds))
        : [];
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));

    const csv = toCsv(
      [
        "id",
        "fieldId",
        "fieldName",
        "authorId",
        "authorName",
        "previousStage",
        "newStage",
        "note",
        "createdAt",
      ],
      updates.map((u) => [
        u.id,
        u.fieldId,
        fieldNameMap.get(u.fieldId) ?? "",
        u.authorId,
        authorMap.get(u.authorId) ?? "",
        u.previousStage ?? "",
        u.newStage ?? "",
        u.note,
        u.createdAt.toISOString(),
      ]),
    );
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="smartseason-updates-${stamp}.csv"`,
    );
    res.send(csv);
  },
);

export default router;
