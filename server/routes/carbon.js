import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Carbon footprint calculation endpoint
router.post('/calculate', authenticateToken, (req, res) => {
  try {
    const { electricity, travel, waste } = req.body;

    // Validate input data
    if (typeof electricity !== 'number' || electricity < 0 ||
        typeof travel !== 'number' || travel < 0 ||
        typeof waste !== 'number' || waste < 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Electricity, travel, and waste must be non-negative numbers'
      });
    }

    // Carbon footprint calculation formula
    // These are simplified emission factors (kg CO2 per unit)
    const electricityFactor = 0.85; // kg CO2 per kWh
    const travelFactor = 0.21;      // kg CO2 per km (average car)
    const wasteFactor = 0.57;       // kg CO2 per kg waste

    const footprint = (electricity * electricityFactor) + 
                     (travel * travelFactor) + 
                     (waste * wasteFactor);

    // Round to 2 decimal places
    const roundedFootprint = Math.round(footprint * 100) / 100;

    console.log(`Carbon calculation for user ${req.user.id}:`, {
      electricity,
      travel,
      waste,
      footprint: roundedFootprint
    });

    res.json({
      footprint: roundedFootprint,
      breakdown: {
        electricity: Math.round(electricity * electricityFactor * 100) / 100,
        travel: Math.round(travel * travelFactor * 100) / 100,
        waste: Math.round(waste * wasteFactor * 100) / 100
      },
      factors: {
        electricityFactor,
        travelFactor,
        wasteFactor
      }
    });

  } catch (error) {
    console.error('Carbon calculation error:', error);
    res.status(500).json({
      error: 'Calculation failed',
      message: 'Unable to calculate carbon footprint'
    });
  }
});

// Get carbon footprint history (placeholder for future implementation)
router.get('/history', authenticateToken, (req, res) => {
  res.json({
    message: 'Carbon footprint history endpoint',
    user: req.user.id,
    history: [] // Placeholder for future database integration
  });
});

export default router;