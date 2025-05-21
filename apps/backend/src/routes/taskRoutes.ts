// src/routes/taskRoutes.ts
import express from 'express';
import { createTask, getTasksByProject } from '../controllers/taskController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', verifyToken, createTask);
router.get('/project/:projectId', verifyToken, getTasksByProject);

export default router;
