const { Router } = require('express');
const router = Router();
const authController = require('../controller/authController');
const loadPages = require('../controller/loadPages');
const {authMiddleware} = require('../middleware/authMiddleware');

// Load pages
router.get('/', loadPages.getAuth);
router.get('/dashboard', loadPages.getDashboard);
router.get('/inventory', authMiddleware, loadPages.renderInventory);
router.get('/menu', authMiddleware, loadPages.renderMenu);
router.get('/orders', authMiddleware, loadPages.renderOrders);

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
//router.get('/api/menu/:id', authController.makeOrder);

router.get('/api/menu/:itemId', authController.fetchItemDetails);
router.post('/api/orders', authController.placeOrder);

// Order routes
router.get('/api/orders', authController.fetchOrders);
router.put('/api/orders/:id', authController.updateOrderStatus);
router.get('/api/orders/:orderId/receipt', authController.getReceipt);

module.exports = router;