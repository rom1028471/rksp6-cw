module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define('Track', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    album: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // длительность в секундах
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1900,
        max: new Date().getFullYear(),
      },
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coverPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    streamPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    playCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  });

  // Ассоциации с другими моделями
  Track.associate = (models) => {
    Track.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    Track.belongsToMany(models.Playlist, {
      through: 'PlaylistTracks',
      foreignKey: 'trackId',
      otherKey: 'playlistId',
      as: 'playlists',
    });
    
    Track.hasMany(models.PlayHistory, {
      foreignKey: 'trackId',
      as: 'playHistory',
    });
  };

  return Track;
}; 