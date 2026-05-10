// backend/src/controllers/updateController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

export const createUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId, stage, notes } = req.body;
    
    if (!fieldId || !stage) {
      return res.status(400).json({ error: 'Field ID and stage are required' });
    }
    
    // Check if field exists and verify access
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    
    // Verify user has access to this field
    if (req.user?.role !== 'ADMIN' && field.agentId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Create update using transaction to ensure consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the update record
      const update = await tx.update.create({
        data: {
          fieldId,
          stage,
          notes: notes || null,
          updatedBy: req.user!.id,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
      });
      
      // Update field's current stage
      await tx.field.update({
        where: { id: fieldId },
        data: { currentStage: stage },
      });
      
      return update;
    });
    
    res.status(201).json({
      success: true,
      update: result
    });
  } catch (error) {
    console.error('Create update error:', error);
    res.status(500).json({ error: 'Failed to create update' });
  }
};

export const getFieldUpdates = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params as { fieldId: string };
    
    // Verify field exists and user has access
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    
    if (req.user?.role !== 'ADMIN' && field.agentId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = await prisma.update.findMany({
      where: { fieldId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(updates);
  } catch (error) {
    console.error('Get updates error:', error);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
};

export const getAllUpdates = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins can see all updates
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const updates = await prisma.update.findMany({
      include: {
        field: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to latest 50 updates
    });
    
    res.json(updates);
  } catch (error) {
    console.error('Get all updates error:', error);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
};