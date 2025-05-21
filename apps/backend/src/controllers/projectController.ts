// src/controllers/projectController.ts
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ message: 'User not authenticated' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: userId,
        projectMembers: {
          create: {
            userId: userId,
            role: req.user?.role || 'MANAGER',
          },
        },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};


export const getProjects = async (_req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    include: {
      projectMembers: true,
    },
  });
  res.json(projects);
};
