import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import carbonRoutes from './routes/carbon.js';
import googleCalendarRoutes from './routes/google-calendar.js';
import slackRoutes from './routes/slack.js';
import mockIntegrations from './routes/mock-integrations.js';
import descopeAuth from './middleware/descope-auth.js';
import debugRoutes from './routes/debug.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.descope.com", "https://accounts.google.com", "https://www.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  // In production, restrict to configured FRONTEND_URL. In development, allow localhost dev servers
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'production') {
      const allowed = [process.env.FRONTEND_URL];
      return callback(null, allowed.includes(origin));
    }
    // Allow undefined origin (e.g., curl), allow localhost on common dev ports
    if (!origin) return callback(null, true);
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return callback(null, true);
    } catch (e) {
      // fallback: allow if matches common dev hosts
      if (origin.startsWith('http://localhost')) return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // include testing headers used to pass provider tokens directly
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Slack-Access-Token', 'X-Google-Access-Token']
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', carbonRoutes);

// Protect calendar and slack routes with Descope authentication
app.use('/api/calendar', descopeAuth, googleCalendarRoutes);
app.use('/api/slack', descopeAuth, slackRoutes);

// Dev-only debug routes
app.use('/api/debug', debugRoutes);

// Mock integration routes for testing (temporary)
app.use('/api', mockIntegrations);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler (Correct)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌍 EcoImpact Tracker API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;