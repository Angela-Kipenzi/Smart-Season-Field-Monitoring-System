
export type UpdateUserRoleBodyRole =
  (typeof UpdateUserRoleBodyRole)[keyof typeof UpdateUserRoleBodyRole];

export const UpdateUserRoleBodyRole = {
  admin: "admin",
  field_agent: "field_agent",
} as const;
