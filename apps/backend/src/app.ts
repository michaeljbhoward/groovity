import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import activityRoutes from './routes/activities';
import feedRoutes from './routes/feed';
import socialRoutes from './routes/social';
import userRoutes from './routes/users';
import statsRoutes from './routes/stats';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

export default app;
