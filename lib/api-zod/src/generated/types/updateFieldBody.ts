
import type { Stage } from "./stage";

export interface UpdateFieldBody {
  name?: string;
  cropType?: string;
  /** @nullable */
  location?: string | null;
  /** @nullable */
  areaHectares?: number | null;
  plantingDate?: Date;
  /** @nullable */
  expectedHarvestDate?: Date | null;
  stage?: Stage;
  /** @nullable */
  assignedAgentId?: number | null;
  /** @nullable */
  notes?: string | null;
}
