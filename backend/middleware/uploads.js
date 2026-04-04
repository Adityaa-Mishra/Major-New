const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_MEDIA_SIZE = 25 * 1024 * 1024;
const uploadsRoot = path.join(__dirname, '..', 'uploads');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createDiskStorage(subFolder) {
  const destination = path.join(uploadsRoot, subFolder);
  ensureDir(destination);

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destination),
    filename: (req, file, cb) => {
      const safeExt = path.extname(file.originalname || '').toLowerCase();
      const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${safeExt}`);
    }
  });
}

function mediaFilter(req, file, cb) {
  if (file.mimetype?.startsWith('image/') || file.mimetype?.startsWith('video/')) {
    cb(null, true);
    return;
  }
  cb(new Error('Only image and video files are allowed'));
}

const uploadChatMedia = multer({
  storage: createDiskStorage('chat'),
  limits: { fileSize: MAX_MEDIA_SIZE },
  fileFilter: mediaFilter
}).single('media');

const uploadWorkMedia = multer({
  storage: createDiskStorage('work'),
  limits: { fileSize: MAX_MEDIA_SIZE },
  fileFilter: mediaFilter
}).single('media');

module.exports = {
  uploadChatMedia,
  uploadWorkMedia,
  MAX_MEDIA_SIZE
};

