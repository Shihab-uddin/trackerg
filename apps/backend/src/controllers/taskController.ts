// src/controllers/taskController.ts
import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, dueDate, projectId, assignedToId } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate,
        projectId,
        assignedToId,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Could not create task' });
  }
};

export const getTasksByProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignedTo: true,
    },
  });

  res.json(tasks);
};
