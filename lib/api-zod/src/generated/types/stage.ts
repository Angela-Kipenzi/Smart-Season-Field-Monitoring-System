
export type Stage = (typeof Stage)[keyof typeof Stage];

export const Stage = {
  planted: "planted",
  growing: "growing",
  ready: "ready",
  harvested: "harvested",
} as const;
