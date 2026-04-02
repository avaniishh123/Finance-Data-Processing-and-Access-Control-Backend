const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./dashboard.controller');

// Viewers can see the dashboard; all roles allowed
router.use(authenticate);

router.get('/summary', ctrl.getSummary);
router.get('/by-category', ctrl.getByCategory);
router.get('/trends', ctrl.getTrends);
router.get('/recent', ctrl.getRecentActivity);

module.exports = router;
