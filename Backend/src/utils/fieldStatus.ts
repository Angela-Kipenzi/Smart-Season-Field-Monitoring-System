// backend/src/utils/fieldStatus.ts
import { Field, Stage } from '@prisma/client';

interface FieldWithStages extends Field {
  currentStage: Stage;
  plantingDate: Date;
}

/**
 * Calculate the status of a field based on its current stage and planting date
 * 
 * Status Logic:
 * - Completed: Field is harvested
 * - At Risk: Field is taking longer than expected in current stage
 * - Active: Field is progressing normally
 */
export const calculateFieldStatus = (field: FieldWithStages): string => {
  const today = new Date();
  const plantingDate = new Date(field.plantingDate);
  const daysSincePlanting = Math.floor(
    (today.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Completed: Field is harvested
  if (field.currentStage === 'HARVESTED') {
    return 'Completed';
  }
  
  // Expected duration ranges for each stage (in days)
  const expectedDurations: Record<Stage, { min: number; max: number; cumulativeMax: number }> = {
    PLANTED: { min: 20, max: 30, cumulativeMax: 30 },
    GROWING: { min: 40, max: 50, cumulativeMax: 80 },
    READY: { min: 10, max: 15, cumulativeMax: 95 },
    HARVESTED: { min: 0, max: 0, cumulativeMax: 0 }
  };
  
  const currentStageExpected = expectedDurations[field.currentStage];
  
  // At Risk: Field has exceeded expected duration for current stage
  if (daysSincePlanting > currentStageExpected.cumulativeMax) {
    return 'At Risk';
  }
  
  // Special check for PLANTED stage
  if (field.currentStage === 'PLANTED' && daysSincePlanting > 30) {
    return 'At Risk';
  }
  
  // Active: All other cases
  return 'Active';
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
      return 'bg-orange-100 text-orange-800';
    case 'Completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get stage order for progression
 */
export const getStageOrder = (stage: Stage): number => {
  const order: Record<Stage, number> = {
    PLANTED: 1,
    GROWING: 2,
    READY: 3,
    HARVESTED: 4
  };
  return order[stage];
};