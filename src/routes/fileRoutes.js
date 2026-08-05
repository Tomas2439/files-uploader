const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { ensureAuthenticated } = require('../middleware/auth');
const { upload } = require('../config/multer');

const handleMulterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;
      const targetUrl = folderId ? `/drive/folder/${folderId}` : '/drive';
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.redirect(`${targetUrl}?error=${encodeURIComponent('El archivo supera el tamaño máximo permitido (15 MB).')}`);
      }
      return res.redirect(`${targetUrl}?error=${encodeURIComponent(err.message || 'Error al procesar la subida del archivo.')}`);
    }
    next();
  });
};

router.post('/drive/file/upload', ensureAuthenticated, handleMulterUpload, fileController.uploadFileHandler);
router.get('/drive/file/:id', ensureAuthenticated, fileController.getFileDetails);
router.get('/drive/file/:id/download', fileController.downloadFile); // Allows download with shareToken or owner auth
router.post('/drive/file/:id/delete', ensureAuthenticated, fileController.deleteFileHandler);

module.exports = router;
