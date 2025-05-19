module.exports = (sequelize, DataTypes) => {
  const FavoritePlaylist = sequelize.define('FavoritePlaylist', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    playlist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'playlist_id',
    },
  }, {
    tableName: 'favorite_playlists',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  // Ассоциации с другими моделями
  FavoritePlaylist.associate = (models) => {
    FavoritePlaylist.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
    
    FavoritePlaylist.belongsTo(models.Playlist, {
      foreignKey: 'playlist_id',
      as: 'playlist',
      onDelete: 'CASCADE',
    });
  };

  return FavoritePlaylist;
}; 