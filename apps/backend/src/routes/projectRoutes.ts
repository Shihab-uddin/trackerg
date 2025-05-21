// src/routes/projectRoutes.ts
import express from 'express';
import { createProject, getProjects } from '../controllers/projectController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', verifyToken, createProject);
router.get('/', verifyToken, getProjects);

export default router;
