const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config');

const basename = path.basename(__filename);
const db = {};

// Инициализация соединения с базой данных
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Определим порядок загрузки моделей для соблюдения зависимостей
const modelOrder = [
  'user.js',
  'track.js',
  'playbackPosition.js',
  'userDevice.js',
  'favoriteTrack.js',
  'playHistory.js',
  'deviceSession.js',
];

// Сначала загружаем модели в определенном порядке
modelOrder.forEach(modelFile => {
  if (fs.existsSync(path.join(__dirname, modelFile))) {
    const model = require(path.join(__dirname, modelFile))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }
});

// Затем загружаем остальные модели, которые могли быть не указаны в modelOrder
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      !modelOrder.includes(file) &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Установка ассоциаций между моделями
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; 