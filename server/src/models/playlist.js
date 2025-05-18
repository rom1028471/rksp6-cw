module.exports = (sequelize, DataTypes) => {
  const Playlist = sequelize.define('Playlist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isLoop: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  Playlist.associate = (models) => {
    Playlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    Playlist.belongsToMany(models.Track, {
      through: 'PlaylistTracks',
      foreignKey: 'playlistId',
      otherKey: 'trackId',
      as: 'tracks',
    });
  };

  return Playlist;
}; 