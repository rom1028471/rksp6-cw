module.exports = (sequelize, DataTypes) => {
  const DeviceSession = sequelize.define('DeviceSession', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastActive: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    currentTrackId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentPosition: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPlaying: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  // Ассоциации с другими моделями
  DeviceSession.associate = (models) => {
    DeviceSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    
    DeviceSession.belongsTo(models.Track, {
      foreignKey: 'currentTrackId',
      as: 'currentTrack',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return DeviceSession;
}; 