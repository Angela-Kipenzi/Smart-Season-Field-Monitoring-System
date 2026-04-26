

export type FieldStatus = (typeof FieldStatus)[keyof typeof FieldStatus];

export const FieldStatus = {
  active: "active",
  at_risk: "at_risk",
  completed: "completed",
} as const;
