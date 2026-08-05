const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyJwt } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyJwt, authController.getProfile);

module.exports = router;
