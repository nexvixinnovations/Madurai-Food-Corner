const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');

/**
 * Routes for /api/menu
 */

// GET scheduled menu items for date (query parameter or default today)
router.get('/', menuController.getMenu);

// POST create menu schedule entry
router.post('/', menuController.createMenu);

// PUT update menu schedule entry by ID
router.put('/:id', menuController.updateMenu);

// DELETE menu schedule entry by ID
router.delete('/:id', menuController.deleteMenu);

// PATCH toggle or set availability status of a scheduled menu item
router.patch('/:id/status', menuController.toggleMenuStatus);

// GET scheduled menu items for specific date (route parameter YYYY-MM-DD)
// Placed after /:id routes so UUID vs Date parameter routing works cleanly
router.get('/:date', menuController.getMenuByDateParam);

module.exports = router;
