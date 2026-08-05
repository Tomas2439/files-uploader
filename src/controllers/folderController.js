const prisma = require('../config/prisma');
const { deleteFile } = require('../config/cloudinary');

/**
 * Builds breadcrumb trail array from current folder up to root.
 */
async function buildBreadcrumbs(folderId, userId) {
  const breadcrumbs = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findFirst({
      where: { id: currentId, userId }
    });
    if (!folder) break;
    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  // Root entry
  breadcrumbs.unshift({ id: null, name: 'Mi Unidad' });
  return breadcrumbs;
}

/**
 * Recursively gets all files under a folder and its subfolders
 */
async function getAllSubfolderFiles(folderId) {
  let files = await prisma.file.findMany({
    where: { folderId }
  });

  const subfolders = await prisma.folder.findMany({
    where: { parentId: folderId }
  });

  for (const sub of subfolders) {
    const childFiles = await getAllSubfolderFiles(sub.id);
    files = files.concat(childFiles);
  }

  return files;
}

async function getDrive(req, res, next) {
  try {
    const userId = req.user.id;
    const folderId = req.params.id ? parseInt(req.params.id, 10) : null;

    let currentFolder = null;
    if (folderId) {
      currentFolder = await prisma.folder.findFirst({
        where: { id: folderId, userId }
      });

      if (!currentFolder) {
        return res.status(404).render('error', {
          title: 'Carpeta No Encontrada',
          message: 'La carpeta solicitada no existe o no tienes permiso para verla.',
          user: req.user
        });
      }
    }

    const subfolders = await prisma.folder.findMany({
      where: { userId, parentId: folderId },
      orderBy: { name: 'asc' }
    });

    const files = await prisma.file.findMany({
      where: { userId, folderId },
      orderBy: { createdAt: 'desc' }
    });

    const breadcrumbs = await buildBreadcrumbs(folderId, userId);

    res.render('drive/index', {
      title: currentFolder ? `${currentFolder.name} - Odin Drive` : 'Mi Unidad - Odin Drive',
      user: req.user,
      currentFolder,
      subfolders,
      files,
      breadcrumbs,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    next(err);
  }
}

async function createFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, parentId } = req.body;

    if (!name || name.trim() === '') {
      const redirectUrl = parentId ? `/drive/folder/${parentId}?error=El nombre de la carpeta no puede estar vacío` : '/drive?error=El nombre de la carpeta no puede estar vacío';
      return res.redirect(redirectUrl);
    }

    const parsedParentId = parentId ? parseInt(parentId, 10) : null;

    if (parsedParentId) {
      const parentExists = await prisma.folder.findFirst({
        where: { id: parsedParentId, userId }
      });
      if (!parentExists) {
        return res.redirect('/drive?error=Carpeta contenedora no existe');
      }
    }

    await prisma.folder.create({
      data: {
        name: name.trim(),
        userId,
        parentId: parsedParentId
      }
    });

    const targetUrl = parsedParentId ? `/drive/folder/${parsedParentId}` : '/drive';
    res.redirect(targetUrl);
  } catch (err) {
    next(err);
  }
}

async function renameFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const folderId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.redirect(`/drive/folder/${folderId}?error=El nombre no puede estar vacío`);
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId }
    });

    if (!folder) {
      return res.redirect('/drive?error=Carpeta no encontrada');
    }

    await prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() }
    });

    res.redirect(folder.parentId ? `/drive/folder/${folder.parentId}` : '/drive');
  } catch (err) {
    next(err);
  }
}

async function deleteFolder(req, res, next) {
  try {
    const userId = req.user.id;
    const folderId = parseInt(req.params.id, 10);

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId }
    });

    if (!folder) {
      return res.redirect('/drive?error=Carpeta no encontrada');
    }

    // Delete all nested files in Cloudinary or local disk
    const allFiles = await getAllSubfolderFiles(folderId);
    for (const file of allFiles) {
      await deleteFile(file.publicId, file.storageType);
    }

    // Delete folder in Prisma (cascade deletes subfolders and files DB records)
    await prisma.folder.delete({
      where: { id: folderId }
    });

    const targetUrl = folder.parentId ? `/drive/folder/${folder.parentId}` : '/drive';
    res.redirect(targetUrl);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDrive,
  createFolder,
  renameFolder,
  deleteFolder
};
