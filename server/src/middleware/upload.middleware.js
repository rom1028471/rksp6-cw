const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Конфигурация для загрузки аудио файлов
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    
    // Создаем директорию, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Конфигурация для загрузки изображений
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images');
    
    // Создаем директорию, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
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
  storage: multer.diskStorage({ // Используем общее хранилище или настроим по полю
    destination: (req, file, cb) => {
      let uploadDir;
      if (file.fieldname === 'audio') {
        uploadDir = path.join(__dirname, '../../uploads/audio');
      } else if (file.fieldname === 'cover') {
        uploadDir = path.join(__dirname, '../../uploads/images');
      } else {
        // Обработка случая с неизвестным полем, хотя фильтр должен это предотвратить
        return cb(new Error('Unknown fieldname for storage'), null);
      }
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  }),
  fileFilter: trackFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Общий лимит или можно задать по полям в роуте
  }
});

// Middleware для обработки ошибок загрузки
exports.handleUploadError = (req, res, next) => {
  return (err, req, res, next) => {
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
}; 