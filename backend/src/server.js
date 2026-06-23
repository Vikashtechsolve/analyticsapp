require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { bootstrapSuperAdmin, migrateInstructors } = require('./config/bootstrap');
const { startSyncCron } = require('./jobs/syncCron');

const authRoutes = require('./routes/auth');
const classroomRoutes = require('./routes/classrooms');
const divisionRoutes = require('./routes/divisions');
const studentRoutes = require('./routes/students');
const publicRoutes = require('./routes/public');
const platformRoutes = require('./routes/platform');
const orgMembersRoutes = require('./routes/orgMembers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/orgs/:orgId', orgMembersRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/public', publicRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const start = async () => {
  await connectDB();
  await bootstrapSuperAdmin();
  await migrateInstructors();
  startSyncCron();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
