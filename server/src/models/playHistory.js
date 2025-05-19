module.exports = (sequelize, DataTypes) => {
  const PlayHistory = sequelize.define('PlayHistory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    track_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'track_id',
    },
    position: {
      type: DataTypes.INTEGER, // позиция в секундах, на которой закончили слушать
      allowNull: false,
      defaultValue: 0,
    },
    device_id: {
      type: DataTypes.STRING, // идентификатор устройства
      allowNull: true,
      field: 'device_id',
    },
    completed: {
      type: DataTypes.BOOLEAN, // завершено ли прослушивание
      defaultValue: false,
    },
    listened_at: {
      type: DataTypes.DATE, // время прослушивания
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'listened_at',
    },
    duration: {
      type: DataTypes.INTEGER, // длительность прослушивания в секундах
      allowNull: false,
      defaultValue: 0,
    }
  }, {
    tableName: 'play_history',
    underscored: true,
  });

  // Ассоциации с другими моделями
  PlayHistory.associate = (models) => {
    PlayHistory.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    
    PlayHistory.belongsTo(models.Track, {
      foreignKey: 'track_id',
      as: 'track',
    });
  };

  return PlayHistory;
}; 