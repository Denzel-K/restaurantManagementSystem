const { Router } = require('express');
const router = Router();
const authController = require('../controller/authController');
const loadPages = require('../controller/loadPages');

// Load pages
router.get('/', loadPages.getHome);
router.get('/dashboard', loadPages.getDashboard);
router.get('/inventory', loadPages.renderInventory);
router.get('/menu', loadPages.renderMenu);
router.get('/orders', loadPages.renderOrders);

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);

// Inventory routes
router.get('/api/inventory', authController.getInventory);
router.post('/api/addItem', authController.addItem);
router.put('/api/inventory/:id', authController.updateItemDetails);
router.delete('/api/inventory/:id' ,authController.deleteItem);

// Menu routes
router.get('/api/menu', authController.getMenuItems); 
router.post('/api/menu', authController.addMenuItem); 
router.put('/api/menu/:id', authController.updateMenuItem); 
router.delete('/api/menu/:id', authController.deleteMenuItem);
router.get('/api/menu/:id', authController.makeOrder);

// Order routes


module.exports = router;