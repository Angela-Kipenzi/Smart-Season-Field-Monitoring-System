// backend/src/controllers/fieldController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { calculateFieldStatus } from '../utils/fieldStatus';

export const createField = async (req: AuthRequest, res: Response) => {
  try {
    const { name, cropType, plantingDate, currentStage, agentId } = req.body;
    
    // Validate required fields
    if (!name || !cropType || !plantingDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const field = await prisma.field.create({
      data: {
        name,
        cropType,
        plantingDate: new Date(plantingDate),
        currentStage: currentStage || 'PLANTED',
        agentId: agentId || null,
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        }
      },
    });
    
    res.status(201).json({
      success: true,
      ...field,
      computedStatus: calculateFieldStatus(field)
    });
  } catch (error) {
    console.error('Create field error:', error);
    res.status(500).json({ error: 'Failed to create field' });
  }
};

export const getFields = async (req: AuthRequest, res: Response) => {
  try {
    let fields;
    
    if (req.user?.role === 'ADMIN') {
      // Admin sees all fields
      fields = await prisma.field.findMany({
        include: {
          agent: {
            select: { id: true, name: true, email: true }
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Agent sees only their assigned fields
      fields = await prisma.field.findMany({
        where: { agentId: req.user?.id },
        include: {
          agent: {
            select: { id: true, name: true, email: true }
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    
    // Add computed status to each field
    const fieldsWithStatus = fields.map((field: any) => ({
      ...field,
      computedStatus: calculateFieldStatus(field),
    }));
    
    res.json(fieldsWithStatus);
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
};

export const getField = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    
    const field = await prisma.field.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        },
        updates: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    
    // Check access: Admin can access any field, Agent only their assigned fields
    if (req.user?.role !== 'ADMIN' && field.agentId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      ...field,
      computedStatus: calculateFieldStatus(field),
    });
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
};

export const updateField = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { name, cropType, plantingDate, currentStage, agentId } = req.body;
    
    const field = await prisma.field.update({
      where: { id },
      data: {
        name,
        cropType,
        plantingDate: plantingDate ? new Date(plantingDate) : undefined,
        currentStage,
        agentId,
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        }
      },
    });
    
    res.json({
      success: true,
      ...field,
      computedStatus: calculateFieldStatus(field)
    });
  } catch (error) {
    console.error('Update field error:', error);
    res.status(500).json({ error: 'Failed to update field' });
  }
};

export const deleteField = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    
    await prisma.field.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({ error: 'Failed to delete field' });
  }
};

export const assignAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { agentId } = req.body;
    
    const field = await prisma.field.update({
      where: { id },
      data: { agentId: agentId || null },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        }
      },
    });
    
    res.json({
      success: true,
      ...field,
      computedStatus: calculateFieldStatus(field)
    });
  } catch (error) {
    console.error('Assign agent error:', error);
    res.status(500).json({ error: 'Failed to assign agent' });
  }
};