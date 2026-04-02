const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./records.controller');

router.use(authenticate);

// All roles can view records
router.get('/', ctrl.listRecords);
router.get('/:id', param('id').isInt(), validate, ctrl.getRecord);

// Only admin can create, update, delete
router.post(
  '/',
  authorize('admin'),
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense.'),
    body('category').trim().notEmpty().withMessage('Category is required.'),
    body('date').isISO8601().withMessage('Date must be a valid ISO 8601 date.'),
    body('notes').optional().isString(),
  ],
  validate,
  ctrl.createRecord
);

router.patch(
  '/:id',
  authorize('admin'),
  [
    param('id').isInt(),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
    body('type').optional().isIn(['income', 'expense']),
    body('category').optional().trim().notEmpty(),
    body('date').optional().isISO8601(),
    body('notes').optional().isString(),
  ],
  validate,
  ctrl.updateRecord
);

router.delete('/:id', authorize('admin'), param('id').isInt(), validate, ctrl.deleteRecord);

module.exports = router;
