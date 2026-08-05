const prisma = require('../config/prisma');
const { formatBytes } = require('./fileController');

async function createShareLink(req, res, next) {
  try {
    const userId = req.user.id;
    const folderId = parseInt(req.body.folderId, 10);
    const duration = req.body.duration || '1d'; // default 1 day

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId }
    });

    if (!folder) {
      return res.redirect('/drive?error=Carpeta no encontrada para compartir.');
    }

    let hoursToAdd = 24; // 1d
    if (duration === '1h') hoursToAdd = 1;
    else if (duration === '1d') hoursToAdd = 24;
    else if (duration === '7d') hoursToAdd = 7 * 24;
    else if (duration === '10d') hoursToAdd = 10 * 24;
    else if (duration === '30d') hoursToAdd = 30 * 24;

    const expiresAt = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

    const share = await prisma.folderShare.create({
      data: {
        folderId,
        expiresAt
      }
    });

    const shareUrl = `${req.protocol}://${req.get('host')}/share/${share.id}`;
    const redirectUrl = folder.parentId ? `/drive/folder/${folder.parentId}` : '/drive';

    res.redirect(`${redirectUrl}?success=${encodeURIComponent('Enlace de carpeta compartido generado: ' + shareUrl)}`);
  } catch (err) {
    next(err);
  }
}

async function getSharedFolder(req, res, next) {
  try {
    const shareToken = req.params.shareToken;

    const share = await prisma.folderShare.findUnique({
      where: { id: shareToken },
      include: {
        folder: {
          include: {
            user: { select: { username: true } },
            files: { orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });

    if (!share) {
      return res.status(404).render('error', {
        title: 'Enlace no válido',
        message: 'El enlace de carpeta compartida no existe o ha sido eliminado.',
        user: req.user || null
      });
    }

    const isExpired = new Date(share.expiresAt) <= new Date();

    const filesWithFormattedSize = share.folder.files.map(file => ({
      ...file,
      formattedSize: formatBytes(file.size)
    }));

    res.render('share/shared-folder', {
      title: `Carpeta compartida: ${share.folder.name} - Odin Drive`,
      user: req.user || null,
      folder: share.folder,
      files: filesWithFormattedSize,
      shareToken,
      expiresAt: share.expiresAt,
      isExpired
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createShareLink,
  getSharedFolder
};
