const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { uploadFile, deleteFile } = require('../config/cloudinary');

/**
 * Format bytes into human readable KB / MB
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function uploadFileHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;
    const targetUrl = folderId ? `/drive/folder/${folderId}` : '/drive';

    if (!req.file) {
      return res.redirect(`${targetUrl}?error=Por favor selecciona un archivo para subir.`);
    }

    if (folderId) {
      const folderExists = await prisma.folder.findFirst({
        where: { id: folderId, userId }
      });
      if (!folderExists) {
        return res.redirect('/drive?error=La carpeta destino no existe.');
      }
    }

    // Upload to Cloudinary or Local Fallback
    const uploadResult = await uploadFile(req.file);

    await prisma.file.create({
      data: {
        name: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        storageType: uploadResult.storageType,
        folderId: folderId,
        userId: userId
      }
    });

    res.redirect(`${targetUrl}?success=Archivo subido con éxito.`);
  } catch (err) {
    const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;
    const targetUrl = folderId ? `/drive/folder/${folderId}` : '/drive';
    res.redirect(`${targetUrl}?error=${encodeURIComponent(err.message || 'Error al subir el archivo.')}`);
  }
}

async function getFileDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const fileId = parseInt(req.params.id, 10);

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
      include: { folder: true }
    });

    if (!file) {
      return res.status(404).render('error', {
        title: 'Archivo No Encontrado',
        message: 'El archivo solicitado no existe o no tienes permiso para acceder a él.',
        user: req.user
      });
    }

    const formattedSize = formatBytes(file.size);

    res.render('drive/file-details', {
      title: `${file.name} - Detalles - Odin Drive`,
      user: req.user,
      file,
      formattedSize
    });
  } catch (err) {
    next(err);
  }
}

async function downloadFile(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const fileId = parseInt(req.params.id, 10);

    let file;
    if (userId) {
      file = await prisma.file.findFirst({ where: { id: fileId, userId } });
    }

    // If not owner, check if the file belongs to a shared folder
    if (!file && req.query.shareToken) {
      const share = await prisma.folderShare.findUnique({
        where: { id: req.query.shareToken },
        include: { folder: true }
      });

      if (share && new Date(share.expiresAt) > new Date()) {
        file = await prisma.file.findFirst({
          where: { id: fileId, folderId: share.folderId }
        });
      }
    }

    if (!file) {
      return res.status(404).send('Archivo no encontrado o no autorizado.');
    }

    if (file.storageType === 'cloudinary') {
      return res.redirect(file.url);
    } else {
      const filePath = path.join(__dirname, '../../uploads', file.publicId);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('El archivo ya no está disponible en el servidor local.');
      }
      return res.download(filePath, file.originalName);
    }
  } catch (err) {
    next(err);
  }
}

async function deleteFileHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const fileId = parseInt(req.params.id, 10);

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId }
    });

    if (!file) {
      return res.redirect('/drive?error=Archivo no encontrado');
    }

    // Delete from Cloudinary or local disk
    await deleteFile(file.publicId, file.storageType);

    // Delete record from Prisma DB
    await prisma.file.delete({
      where: { id: fileId }
    });

    const targetUrl = file.folderId ? `/drive/folder/${file.folderId}` : '/drive';
    res.redirect(`${targetUrl}?success=Archivo eliminado correctamente.`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadFileHandler,
  getFileDetails,
  downloadFile,
  deleteFileHandler,
  formatBytes
};
