import express from 'express';
import dotenv from 'dotenv';
import descopeAuth from '../middleware/descope-auth.js';

dotenv.config();
const router = express.Router();

// Dev-only: return the descope-validated session attached by descopeAuth
// Note: expose only in development. Do NOT enable in production.
router.get('/session', descopeAuth, (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Debug endpoint disabled' });
  }

  // Return the attached req.user (includes rawSession in middleware)
  const user = req.user || null;
  return res.json({ session: user });
});

export default router;
