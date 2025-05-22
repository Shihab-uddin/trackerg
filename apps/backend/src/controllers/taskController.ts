// src/controllers/taskController.ts
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

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

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedToId } = req.body;
    console.log("dfshj", id)

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate,
        assignedToId,
      },
    });

    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    if (!assignedToId) {
      res.status(400).json({ message: 'assignedToId is required' });
      return;
    }

    // Ensure user has permission (only MANAGER or ADMIN)
    if (!req.user || !['MANAGER', 'ADMIN'].includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Only MANAGER or ADMIN can assign tasks.' });
      return;
    }

    // Check if the task exists
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Assign or reassign the task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { assignedToId },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: 'Status is required' });
      return;
    }

    // Valid statuses (assuming Prisma enum: TODO, IN_PROGRESS, DONE)
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            projectMembers: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const userId = req.user?.id;
    const isAssignee = task.assignedToId === userId;
    const isManagerOrAdmin = task.project.projectMembers.some(
      (member) =>
        member.userId === userId && (member.role === 'MANAGER' || req.user?.role === 'ADMIN')
    );

    if (!isAssignee && !isManagerOrAdmin) {
      res.status(403).json({ message: 'Access denied. Only assignee or manager/admin can update task status.' });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTasksByUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { projectId } = req.query;

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    // Allow access only if the requester is the user themselves or has elevated roles
    const isSelf = requesterId === userId;
    const isManagerOrAdmin = requesterRole === 'MANAGER' || requesterRole === 'ADMIN';

    if (!isSelf && !isManagerOrAdmin) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        ...(projectId ? { projectId: projectId as string } : {}),
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const filterTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      priority,
      projectId,
      dueFrom,
      dueTo,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = req.query;

    const filters: any = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (projectId) filters.projectId = projectId;

    if (dueFrom || dueTo) {
      filters.dueDate = {};
      if (dueFrom) filters.dueDate.gte = new Date(dueFrom as string);
      if (dueTo) filters.dueDate.lte = new Date(dueTo as string);
    }

    const validSortFields = ['dueDate', 'priority', 'createdAt'];
    let orderBy: Prisma.TaskOrderByWithRelationInput | undefined = undefined;

    if (sortBy && validSortFields.includes(sortBy as string)) {
      orderBy = {
        [sortBy as keyof Prisma.TaskOrderByWithRelationInput]: (sortOrder === 'desc' ? 'desc' : 'asc'),
      };
    }

    const tasks = await prisma.task.findMany({
      where: filters,
      orderBy,
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error filtering tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { q } = req.query;
  const user = req.user;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ message: 'Search query is required' });
    return;
  }

  try {
    const filters: Prisma.TaskWhereInput = {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
      ],
    };

    if (user?.role !== 'ADMIN') {
      filters.project = {
        projectMembers: {
          some: {
            userId: user?.id,
          },
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where: filters,
      include: {
        assignedTo: true,
        project: true,
      },
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({ message: 'Failed to search tasks' });
  }
};

// GET /api/tasks/paginated?page=1&limit=10
export const getPaginatedTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count(),
    ]);

    res.json({
      tasks,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
    });
  } catch (err) {
    console.error('Pagination error:', err);
    res.status(500).json({ message: 'Failed to paginate tasks' });
  }
};



