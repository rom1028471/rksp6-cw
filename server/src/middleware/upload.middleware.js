const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Конфигурация хранилища для аудио файлов в Cloudinary
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'audio',
    resource_type: 'video', // Cloudinary treats audio as video
    format: async (req, file) => 'mp3', // or other audio formats
  },
});

// Конфигурация хранилища для изображений в Cloudinary
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'images',
    format: async (req, file) => 'webp',
  },
});

// Фильтр для аудио файлов
const audioFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый формат аудио файла'), false);
  }
};

// Фильтр для изображений
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый формат изображения'), false);
  }
};

// Middleware для загрузки аудио файлов
exports.uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  }
});

// Middleware для загрузки изображений
exports.uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  }
});

// Middleware для загрузки трека (аудио + обложка)
const trackStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        let folder;
        let resource_type;
        if (file.fieldname === 'audio') {
            folder = 'audio';
            resource_type = 'video';
        } else if (file.fieldname === 'cover') {
            folder = 'images';
            resource_type = 'image';
        }
        return {
            folder: folder,
            resource_type: resource_type,
            format: file.fieldname === 'audio' ? 'mp3' : 'webp'
        };
    },
});

const trackFileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат аудио файла для поля audio'), false);
    }
  } else if (file.fieldname === 'cover') {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат изображения для поля cover'), false);
    }
  } else {
    cb(new Error('Неожиданное поле файла'), false);
  }
};

exports.uploadTrackAndCover = multer({
    storage: trackStorage,
    fileFilter: trackFileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024,
    }
});

// Middleware для обработки ошибок загрузки
exports.handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
}; 