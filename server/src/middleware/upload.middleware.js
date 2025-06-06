const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Убедимся, что директории для загрузки существуют
const audioDir = path.join(__dirname, '../../uploads/audio');
const imageDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });


// Конфигурация Cloudinary - больше не используется
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// Локальное хранилище для треков
const trackStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest;
    if (file.fieldname === 'audio') {
      dest = audioDir;
    } else if (file.fieldname === 'cover') {
      dest = imageDir;
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
  storage: trackStorage, // Используем локальное хранилище
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  }
});

// Middleware для загрузки изображений
exports.uploadImage = multer({
  storage: trackStorage, // Используем локальное хранилище
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  }
});

// Middleware для загрузки трека (аудио + обложка)
// const trackStorageCloudinary = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: (req, file) => {
//         let folder;
//         let resource_type;
//         if (file.fieldname === 'audio') {
//             folder = 'audio';
//             resource_type = 'video';
//         } else if (file.fieldname === 'cover') {
//             folder = 'images';
//             resource_type = 'image';
//         }
//         return {
//             folder: folder,
//             resource_type: resource_type,
//             format: file.fieldname === 'audio' ? 'mp3' : 'webp'
//         };
//     },
// });

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
    storage: trackStorage, // Используем локальное хранилище
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