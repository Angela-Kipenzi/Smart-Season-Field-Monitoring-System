

export interface FieldUpdate {
  id: number;
  fieldId: number;
  authorId: number;
  authorName: string;
  /** @nullable */
  previousStage?: string | null;
  /** @nullable */
  newStage?: string | null;
  note: string;
  createdAt: Date;
}
