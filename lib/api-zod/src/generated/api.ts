
import * as zod from "zod";

/**
 * @summary Health check
 */
export const HealthCheckResponse = zod.object({
  status: zod.string(),
});

/**
 * @summary Get current authenticated user (with role)
 */
export const GetMeResponse = zod.object({
  user: zod.object({
    id: zod.number(),
    clerkId: zod.string(),
    email: zod.string(),
    name: zod.string(),
    role: zod.enum(["admin", "field_agent"]),
    createdAt: zod.coerce.date(),
  }),
});

/**
 * @summary List all users (admin only)
 */
export const ListUsersResponseItem = zod.object({
  id: zod.number(),
  clerkId: zod.string(),
  email: zod.string(),
  name: zod.string(),
  role: zod.enum(["admin", "field_agent"]),
  createdAt: zod.coerce.date(),
});
export const ListUsersResponse = zod.array(ListUsersResponseItem);

/**
 * @summary List field agents (admin only)
 */
export const ListFieldAgentsResponseItem = zod.object({
  id: zod.number(),
  clerkId: zod.string(),
  email: zod.string(),
  name: zod.string(),
  role: zod.enum(["admin", "field_agent"]),
  createdAt: zod.coerce.date(),
});
export const ListFieldAgentsResponse = zod.array(ListFieldAgentsResponseItem);

/**
 * @summary Update a user's role (admin only)
 */
export const UpdateUserRoleParams = zod.object({
  id: zod.coerce.number(),
});

export const UpdateUserRoleBody = zod.object({
  role: zod.enum(["admin", "field_agent"]),
});

export const UpdateUserRoleResponse = zod.object({
  id: zod.number(),
  clerkId: zod.string(),
  email: zod.string(),
  name: zod.string(),
  role: zod.enum(["admin", "field_agent"]),
  createdAt: zod.coerce.date(),
});

/**
 * @summary List fields (admin sees all, agent sees assigned)
 */
export const ListFieldsResponseItem = zod.object({
  id: zod.number(),
  name: zod.string(),
  cropType: zod.string(),
  location: zod.string().nullish(),
  areaHectares: zod.number().nullish(),
  plantingDate: zod.coerce.date(),
  expectedHarvestDate: zod.coerce.date().nullish(),
  stage: zod.enum(["planted", "growing", "ready", "harvested"]),
  status: zod.enum(["active", "at_risk", "completed"]),
  assignedAgentId: zod.number().nullish(),
  assignedAgentName: zod.string().nullish(),
  lastUpdateAt: zod.coerce.date().nullish(),
  notes: zod.string().nullish(),
  createdAt: zod.coerce.date(),
  updatedAt: zod.coerce.date(),
});
export const ListFieldsResponse = zod.array(ListFieldsResponseItem);

/**
 * @summary Create a field (admin only)
 */
export const CreateFieldBody = zod.object({
  name: zod.string(),
  cropType: zod.string(),
  location: zod.string().nullish(),
  areaHectares: zod.number().nullish(),
  plantingDate: zod.coerce.date(),
  expectedHarvestDate: zod.coerce.date().nullish(),
  stage: zod.enum(["planted", "growing", "ready", "harvested"]).optional(),
  assignedAgentId: zod.number().nullish(),
  notes: zod.string().nullish(),
});

/**
 * @summary Get a field by id
 */
export const GetFieldParams = zod.object({
  id: zod.coerce.number(),
});

export const GetFieldResponse = zod.object({
  id: zod.number(),
  name: zod.string(),
  cropType: zod.string(),
  location: zod.string().nullish(),
  areaHectares: zod.number().nullish(),
  plantingDate: zod.coerce.date(),
  expectedHarvestDate: zod.coerce.date().nullish(),
  stage: zod.enum(["planted", "growing", "ready", "harvested"]),
  status: zod.enum(["active", "at_risk", "completed"]),
  assignedAgentId: zod.number().nullish(),
  assignedAgentName: zod.string().nullish(),
  lastUpdateAt: zod.coerce.date().nullish(),
  notes: zod.string().nullish(),
  createdAt: zod.coerce.date(),
  updatedAt: zod.coerce.date(),
});

/**
 * @summary Update a field (admin can edit all; agent can update stage)
 */
export const UpdateFieldParams = zod.object({
  id: zod.coerce.number(),
});

export const UpdateFieldBody = zod.object({
  name: zod.string().optional(),
  cropType: zod.string().optional(),
  location: zod.string().nullish(),
  areaHectares: zod.number().nullish(),
  plantingDate: zod.coerce.date().optional(),
  expectedHarvestDate: zod.coerce.date().nullish(),
  stage: zod.enum(["planted", "growing", "ready", "harvested"]).optional(),
  assignedAgentId: zod.number().nullish(),
  notes: zod.string().nullish(),
});

export const UpdateFieldResponse = zod.object({
  id: zod.number(),
  name: zod.string(),
  cropType: zod.string(),
  location: zod.string().nullish(),
  areaHectares: zod.number().nullish(),
  plantingDate: zod.coerce.date(),
  expectedHarvestDate: zod.coerce.date().nullish(),
  stage: zod.enum(["planted", "growing", "ready", "harvested"]),
  status: zod.enum(["active", "at_risk", "completed"]),
  assignedAgentId: zod.number().nullish(),
  assignedAgentName: zod.string().nullish(),
  lastUpdateAt: zod.coerce.date().nullish(),
  notes: zod.string().nullish(),
  createdAt: zod.coerce.date(),
  updatedAt: zod.coerce.date(),
});

/**
 * @summary Delete a field (admin only)
 */
export const DeleteFieldParams = zod.object({
  id: zod.coerce.number(),
});

/**
 * @summary List updates for a field
 */
export const ListFieldUpdatesParams = zod.object({
  id: zod.coerce.number(),
});

export const ListFieldUpdatesResponseItem = zod.object({
  id: zod.number(),
  fieldId: zod.number(),
  authorId: zod.number(),
  authorName: zod.string(),
  previousStage: zod.string().nullish(),
  newStage: zod.string().nullish(),
  note: zod.string(),
  createdAt: zod.coerce.date(),
});
export const ListFieldUpdatesResponse = zod.array(ListFieldUpdatesResponseItem);

/**
 * @summary Add an update/note for a field (assigned agent or admin)
 */
export const CreateFieldUpdateParams = zod.object({
  id: zod.coerce.number(),
});

export const CreateFieldUpdateBody = zod.object({
  note: zod.string(),
  newStage: zod
    .union([zod.enum(["planted", "growing", "ready", "harvested"]), zod.null()])
    .optional(),
});

/**
 * @summary Recent updates across visible fields
 */
export const ListRecentUpdatesResponseItem = zod.object({
  id: zod.number(),
  fieldId: zod.number(),
  fieldName: zod.string(),
  authorId: zod.number(),
  authorName: zod.string(),
  previousStage: zod.string().nullish(),
  newStage: zod.string().nullish(),
  note: zod.string(),
  createdAt: zod.coerce.date(),
});
export const ListRecentUpdatesResponse = zod.array(
  ListRecentUpdatesResponseItem,
);

/**
 * @summary Aggregate summary for current user (scoped by role)
 */
export const GetDashboardSummaryResponse = zod.object({
  totalFields: zod.number(),
  activeCount: zod.number(),
  atRiskCount: zod.number(),
  completedCount: zod.number(),
  totalAgents: zod.number().nullish(),
  stageBreakdown: zod.array(
    zod.object({
      stage: zod.enum(["planted", "growing", "ready", "harvested"]),
      count: zod.number(),
    }),
  ),
  statusBreakdown: zod.array(
    zod.object({
      status: zod.enum(["active", "at_risk", "completed"]),
      count: zod.number(),
    }),
  ),
  recentUpdates: zod.array(
    zod.object({
      id: zod.number(),
      fieldId: zod.number(),
      fieldName: zod.string(),
      authorId: zod.number(),
      authorName: zod.string(),
      previousStage: zod.string().nullish(),
      newStage: zod.string().nullish(),
      note: zod.string(),
      createdAt: zod.coerce.date(),
    }),
  ),
});
