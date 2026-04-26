

export interface FieldUpdateWithField {
  id: number;
  fieldId: number;
  fieldName: string;
  authorId: number;
  authorName: string;
  /** @nullable */
  previousStage?: string | null;
  /** @nullable */
  newStage?: string | null;
  note: string;
  createdAt: Date;
}
