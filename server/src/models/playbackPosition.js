module.exports = (sequelize, DataTypes) => {
  const PlaybackPosition = sequelize.define('PlaybackPosition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_id'
    },
    trackId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'track_id',
      references: {
        model: 'tracks',
        key: 'id'
      }
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
        unique: true,
        fields: ['user_id', 'device_id', 'track_id']
      }
    ]
  });

  // Ассоциации с другими моделями
  PlaybackPosition.associate = (models) => {
    PlaybackPosition.belongsTo(models.User, { foreignKey: 'user_id' });
    PlaybackPosition.belongsTo(models.Track, { 
      foreignKey: 'track_id',
      onDelete: 'CASCADE' 
    });
  };

  return PlaybackPosition;
}; 