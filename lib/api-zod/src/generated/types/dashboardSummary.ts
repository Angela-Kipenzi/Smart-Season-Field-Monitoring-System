
import type { FieldUpdateWithField } from "./fieldUpdateWithField";
import type { StageCount } from "./stageCount";
import type { StatusCount } from "./statusCount";

export interface DashboardSummary {
  totalFields: number;
  activeCount: number;
  atRiskCount: number;
  completedCount: number;
  /** @nullable */
  totalAgents?: number | null;
  stageBreakdown: StageCount[];
  statusBreakdown: StatusCount[];
  recentUpdates: FieldUpdateWithField[];
}
