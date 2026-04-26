import type { FieldRow } from "@workspace/db";

export type ComputedStatus = "active" | "at_risk" | "completed";

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeFieldStatus(
  field: FieldRow,
  lastUpdateAt: Date | null,
): ComputedStatus {
  if (field.stage === "harvested") return "completed";

  const now = Date.now();
  const planted = new Date(field.plantingDate).getTime();
  const lastActivity = (lastUpdateAt ?? field.createdAt).getTime();

  const daysSinceUpdate = (now - lastActivity) / DAY_MS;
  const daysSincePlanting = (now - planted) / DAY_MS;

  if (daysSinceUpdate >= 14) return "at_risk";
  if (field.stage === "planted" && daysSincePlanting > 7) return "at_risk";

  return "active";
}
