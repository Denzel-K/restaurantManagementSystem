const { Router } = require('express');
const router = Router();
const authController = require('../controller/authController');
const loadPages = require('../controller/loadPages');

router.get('/', loadPages.getHome);
router.get('/dashboard', loadPages.getDashboard);
router.get('/inventory', loadPages.renderInventory);

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);
router.get('/api/inventory', authController.getInventory);
router.post('/api/addItem', authController.addItem);
router.put('/api/inventory/:id', authController.updateItemDetails);
router.delete('/api/inventory/:id' ,authController.deleteItem);

module.exports = router;