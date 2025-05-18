const { validationResult, body } = require('express-validator');

// Middleware для проверки результатов валидации
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Валидация для регистрации пользователя
exports.registerValidation = [
  body('username')
    .notEmpty().withMessage('Имя пользователя обязательно')
    .isLength({ min: 3, max: 30 }).withMessage('Имя пользователя должно быть от 3 до 30 символов'),
  
  body('email')
    .notEmpty().withMessage('Email обязателен')
    .isEmail().withMessage('Некорректный email'),
  
  body('password')
    .notEmpty().withMessage('Пароль обязателен')
    .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
];

// Валидация для входа пользователя
exports.loginValidation = [
  body('email')
    .notEmpty().withMessage('Email обязателен')
    .isEmail().withMessage('Некорректный email'),
  
  body('password')
    .notEmpty().withMessage('Пароль обязателен'),
];

// Валидация для создания трека
exports.trackValidation = [
  body('title')
    .notEmpty().withMessage('Название трека обязательно')
    .isLength({ max: 100 }).withMessage('Название трека не должно превышать 100 символов'),
  
  body('artist')
    .notEmpty().withMessage('Имя исполнителя обязательно')
    .isLength({ max: 100 }).withMessage('Имя исполнителя не должно превышать 100 символов'),
  
  body('album')
    .optional()
    .isLength({ max: 100 }).withMessage('Название альбома не должно превышать 100 символов'),
  
  body('genre')
    .optional()
    .isLength({ max: 50 }).withMessage('Название жанра не должно превышать 50 символов'),
  
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Год должен быть между 1900 и ${new Date().getFullYear()}`),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('Поле isPublic должно быть булевым значением'),
];

// Валидация для создания плейлиста
exports.playlistValidation = [
  body('name')
    .notEmpty().withMessage('Название плейлиста обязательно')
    .isLength({ max: 100 }).withMessage('Название плейлиста не должно превышать 100 символов'),
  
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Описание плейлиста не должно превышать 500 символов'),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('Поле isPublic должно быть булевым значением'),
  
  body('isLoop')
    .optional()
    .isBoolean().withMessage('Поле isLoop должно быть булевым значением'),
];

// Валидация для добавления трека в плейлист
exports.playlistTrackValidation = [
  body('trackId')
    .notEmpty().withMessage('ID трека обязателен')
    .isUUID(4).withMessage('Некорректный ID трека'),
  
  body('position')
    .optional()
    .isInt({ min: 0 }).withMessage('Позиция должна быть неотрицательным числом'),
]; 