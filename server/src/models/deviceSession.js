module.exports = (sequelize, DataTypes) => {
  const DeviceSession = sequelize.define('DeviceSession', {
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
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Tracks',
        key: 'id',
      },
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
    });
    
    DeviceSession.belongsTo(models.Track, {
      foreignKey: 'currentTrackId',
      as: 'currentTrack',
    });
  };

  return DeviceSession;
}; 