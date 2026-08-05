const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file to Cloudinary or saves locally as fallback.
 * @param {Express.Multer.File} file 
 * @returns {Promise<{ url: string, publicId: string, storageType: 'cloudinary' | 'local' }>}
 */
async function uploadFile(file) {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'file_uploader_odin',
          resource_type: 'auto',
          original_filename: path.parse(file.originalname).name,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            storageType: 'cloudinary'
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  } else {
    // Local fallback: save file buffer to uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/${uniqueFilename}`,
      publicId: uniqueFilename,
      storageType: 'local'
    };
  }
}

/**
 * Deletes a file from Cloudinary or local disk
 * @param {string} publicId 
 * @param {string} storageType 
 */
async function deleteFile(publicId, storageType) {
  if (!publicId) return;
  
  if (storageType === 'cloudinary' && isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Error deleting from Cloudinary:', err);
    }
  } else {
    const filePath = path.join(__dirname, '../../uploads', publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadFile,
  deleteFile
};
