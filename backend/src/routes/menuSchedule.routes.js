const express = require('express');
const router = express.Router();
const menuScheduleController = require('../controllers/menuSchedule.controller');

router.get('/', menuScheduleController.getMenuSchedules);
router.post('/', menuScheduleController.createMenuSchedule);
router.delete('/:id', menuScheduleController.deleteMenuSchedule);

module.exports = router;
