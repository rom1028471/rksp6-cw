module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define('Track', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    artist: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // длительность в секундах
      allowNull: true,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path',
    },
    stream_path: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stream_path',
    },
    cover_path: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cover_path',
    },
    play_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'play_count',
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_public',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
  }, {
    tableName: 'tracks',
    underscored: true,
  });

  // Ассоциации с другими моделями
  Track.associate = (models) => {
    Track.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    
    Track.belongsToMany(models.Playlist, {
      through: 'playlist_tracks',
      foreignKey: 'track_id',
      otherKey: 'playlist_id',
      as: 'playlists',
    });
    
    Track.hasMany(models.PlayHistory, {
      foreignKey: 'trackId',
      as: 'playHistory',
    });
  };

  return Track;
}; 