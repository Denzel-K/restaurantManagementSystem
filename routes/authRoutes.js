const { Router } = require('express');
const router = Router();
const authController = require('../controller/authController');
const loadPages = require('../controller/loadPages');

router.get('/', loadPages.getHome);
router.get('/dashboard', loadPages.getDashboard);
router.get('/inventory', loadPages.renderInventory);
router.get('/menu', loadPages.renderMenu);

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);

router.get('/api/inventory', authController.getInventory);
router.post('/api/addItem', authController.addItem);
router.put('/api/inventory/:id', authController.updateItemDetails);
router.delete('/api/inventory/:id' ,authController.deleteItem);

// Menu routes
router.get('/api/menu', authController.getMenuItems); 
router.post('/api/menu', authController.addMenuItem); 
router.put('/api/menu/:id', authController.updateMenuItem); 
router.delete('/api/menu/:id', authController.deleteMenuItem);

module.exports = router;