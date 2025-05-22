// src/routes/projectRoutes.ts
import express from 'express';
import { createProject, getProjects, updateProject, addProjectMember, removeProjectMember, getProjectDetails } from '../controllers/projectController';
import { verifyToken } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { requireProjectManager } from '../middleware/projectRoleMiddleware';

const router = express.Router();

router.post('/', verifyToken, createProject);
router.get('/', verifyToken, getProjects);
router.put('/:id', verifyToken, requireProjectManager, updateProject);
router.post('/:id/members', verifyToken, requireProjectManager, addProjectMember);
router.delete('/:id/members/:userId', verifyToken, requireProjectManager, removeProjectMember);
router.get('/:projectId/details', verifyToken, asyncHandler(getProjectDetails));

export default router;
