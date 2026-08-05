const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { ensureAuthenticated } = require('../middleware/auth');

router.post('/drive/share/create', ensureAuthenticated, shareController.createShareLink);
router.get('/share/:shareToken', shareController.getSharedFolder);

module.exports = router;
