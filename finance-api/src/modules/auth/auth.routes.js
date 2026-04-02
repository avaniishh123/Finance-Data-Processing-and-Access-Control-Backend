const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { login } = require('./auth.controller');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

module.exports = router;
