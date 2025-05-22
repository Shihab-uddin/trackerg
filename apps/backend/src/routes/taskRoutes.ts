// src/routes/taskRoutes.ts
import express from 'express';
import { createTask, getTasksByProject, updateTask, deleteTask, assignTask, updateTaskStatus, getTasksByUser, filterTasks, searchTasks, getPaginatedTasks } from '../controllers/taskController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', verifyToken, createTask);
router.get('/project/:projectId', verifyToken, getTasksByProject);
router.put('/:id', verifyToken, updateTask);
router.delete('/:id', verifyToken, deleteTask);
router.patch('/:id/assign', verifyToken, assignTask);
router.patch('/:id/status', verifyToken, updateTaskStatus);
router.get('/user/:userId', verifyToken, getTasksByUser);
router.get('/filter', verifyToken, filterTasks);
router.get('/search', verifyToken, searchTasks);
router.get('/paginated', verifyToken, getPaginatedTasks);


export default router;
