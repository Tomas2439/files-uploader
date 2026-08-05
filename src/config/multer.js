const multer = require('multer');

// Store in memory buffer so we can send to Cloudinary or write to local disk
const storage = multer.memoryStorage();

// Max file size: 15 MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Optional extension / MIME type filtering if desired.
    // Allow most common user files, block executable / potentially dangerous files
    const forbiddenMimeTypes = [
      'application/x-msdownload',
      'application/x-executable',
      'application/x-sh',
      'application/x-bat'
    ];

    if (forbiddenMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido por razones de seguridad.'));
    }

    cb(null, true);
  }
});

module.exports = {
  upload,
  MAX_FILE_SIZE
};
