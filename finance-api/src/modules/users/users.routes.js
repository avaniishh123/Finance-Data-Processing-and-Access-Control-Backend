const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./users.controller');

// All user management is admin-only
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.listUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('role').isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin.'),
  ],
  validate,
  ctrl.createUser
);

router.patch(
  '/:id',
  [
    param('id').isInt().withMessage('User ID must be an integer.'),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.'),
    body('is_active').optional().isBoolean().withMessage('is_active must be boolean.'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  ],
  validate,
  ctrl.updateUser
);

router.delete('/:id', param('id').isInt(), validate, ctrl.deleteUser);

module.exports = router;
