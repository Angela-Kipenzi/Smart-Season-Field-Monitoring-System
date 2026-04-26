
import type { Stage } from "./stage";

export interface CreateFieldUpdateBody {
  note: string;
  newStage?: Stage | null;
}
