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

// src/controllers/projectController.ts
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const { name, description } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    });

    res.json(project);
  } catch (error) {
    console.error('Update Project Error:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// src/controllers/projectController.ts
export const addProjectMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const { userId, role } = req.body;

  try {
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
    });

    res.status(201).json({ message: 'Member added', member });
  } catch (error) {
    console.error('Add Member Error:', error);
    res.status(500).json({ message: 'Failed to add member' });
  }
};

export const removeProjectMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const userId = req.params.userId;

  try {
    await prisma.projectMember.deleteMany({
      where: { userId, projectId },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
};

export const getProjectDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    console.log("hfbaj", projectId)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const members = project.projectMembers.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    }));

    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      members,
      tasks: project.tasks,
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

