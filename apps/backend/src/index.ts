import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:4000",
    credentials: true, // only needed if you're using cookies or sessions
  })
);

app.use(cors());
app.use(express.json());

// Base route
app.get('/', (_: Request, res: Response) => {
  res.send('API Running');
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Get env variables
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at ${BASE_URL}`);
});
