const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/drive', ensureAuthenticated, folderController.getDrive);
router.get('/drive/folder/:id', ensureAuthenticated, folderController.getDrive);

router.post('/drive/folder/create', ensureAuthenticated, folderController.createFolder);
router.post('/drive/folder/:id/rename', ensureAuthenticated, folderController.renameFolder);
router.post('/drive/folder/:id/delete', ensureAuthenticated, folderController.deleteFolder);

module.exports = router;
