module.exports = (sequelize, DataTypes) => {
  const Playlist = sequelize.define('Playlist', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    cover_path: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cover_path',
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
    tableName: 'playlists',
    underscored: true,
  });

  // Ассоциации с другими моделями
  Playlist.associate = (models) => {
    Playlist.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    
    Playlist.belongsToMany(models.Track, {
      through: 'playlist_tracks',
      foreignKey: 'playlist_id',
      otherKey: 'track_id',
      as: 'tracks',
    });
  };

  return Playlist;
}; 