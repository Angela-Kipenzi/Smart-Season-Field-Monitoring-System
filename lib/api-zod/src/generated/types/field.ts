
import type { FieldStatus } from "./fieldStatus";
import type { Stage } from "./stage";

export interface Field {
  id: number;
  name: string;
  cropType: string;
  /** @nullable */
  location?: string | null;
  /** @nullable */
  areaHectares?: number | null;
  plantingDate: Date;
  /** @nullable */
  expectedHarvestDate?: Date | null;
  stage: Stage;
  status: FieldStatus;
  /** @nullable */
  assignedAgentId?: number | null;
  /** @nullable */
  assignedAgentName?: string | null;
  /** @nullable */
  lastUpdateAt?: Date | null;
  /** @nullable */
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
