module.exports = (sequelize, DataTypes) => {
  const PlaybackPosition = sequelize.define('PlaybackPosition', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    trackId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'track_id',
      references: {
        model: 'tracks',
        key: 'id'
      }
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'device_id'
    },
    position: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    isPlaying: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_playing'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'playback_positions',
    timestamps: false,
    createdAt: false,
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['track_id']
      },
      {
        fields: ['device_id']
      }
    ]
  });

  // Ассоциации с другими моделями
  PlaybackPosition.associate = (models) => {
    PlaybackPosition.belongsTo(models.User, { foreignKey: 'userId' });
    PlaybackPosition.belongsTo(models.Track, { 
      foreignKey: 'trackId',
      onDelete: 'CASCADE' 
    });
  };

  return PlaybackPosition;
}; 