module.exports = (sequelize, DataTypes) => {
  const PlayHistory = sequelize.define('PlayHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    trackId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tracks',
        key: 'id',
      },
    },
    position: {
      type: DataTypes.INTEGER, // позиция воспроизведения в секундах
      allowNull: false,
      defaultValue: 0,
    },
    deviceId: {
      type: DataTypes.STRING, // идентификатор устройства
      allowNull: true,
    },
    completed: {
      type: DataTypes.BOOLEAN, // завершено ли прослушивание
      defaultValue: false,
    },
  });

  // Ассоциации с другими моделями
  PlayHistory.associate = (models) => {
    PlayHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    PlayHistory.belongsTo(models.Track, {
      foreignKey: 'trackId',
      as: 'track',
    });
  };

  return PlayHistory;
}; 