

export type Role = (typeof Role)[keyof typeof Role];

export const Role = {
  admin: "admin",
  field_agent: "field_agent",
} as const;
