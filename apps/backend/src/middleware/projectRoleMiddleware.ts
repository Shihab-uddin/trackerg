import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from './authMiddleware';

export const requireProjectManager = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const projectId = req.params.id || req.body.projectId;
  console.log("afh", projectId)

  if (!projectId) {
    res.status(400).json({ error: 'Project ID is required' });
    return;
  }

  const userId = req.user?.id;

  if (!userId) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!membership || membership.role !== 'MANAGER') {
      res.status(403).json({ error: 'Access denied: Not a project manager' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking project role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};