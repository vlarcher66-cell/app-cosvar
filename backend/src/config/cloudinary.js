const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const isPdf = ext === 'pdf';
    const isDoc = ['doc', 'docx'].includes(ext);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    return {
      folder: 'cosvar/documentos',
      resource_type: isImage ? 'image' : 'raw',
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`,
      format: false,
    };
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

/**
 * Retorna uso de armazenamento do Cloudinary
 */
const getUsage = async () => {
  const result = await cloudinary.api.usage();
  return {
    storage_used_mb: (result.storage.usage / 1024 / 1024).toFixed(1),
    storage_limit_mb: (result.storage.limit / 1024 / 1024).toFixed(0),
    storage_pct: ((result.storage.usage / result.storage.limit) * 100).toFixed(1),
    transformations_used: result.transformations.usage,
    bandwidth_used_mb: (result.bandwidth.usage / 1024 / 1024).toFixed(1),
    credits_used: result.credits?.usage || 0,
    credits_limit: result.credits?.limit || 0,
  };
};

module.exports = { cloudinary, upload, getUsage };
