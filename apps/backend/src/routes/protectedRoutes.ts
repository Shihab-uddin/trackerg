import express from 'express';
import { verifyToken, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me', verifyToken, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  res.json({ user });
});


router.get('/admin', verifyToken, requireRole(['ADMIN']), (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

export default router;
