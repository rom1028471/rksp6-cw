module.exports = (sequelize, DataTypes) => {
  const FavoriteTrack = sequelize.define('FavoriteTrack', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    track_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'track_id',
    },
  }, {
    tableName: 'favorite_tracks',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  // Ассоциации с другими моделями
  FavoriteTrack.associate = (models) => {
    FavoriteTrack.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
    
    FavoriteTrack.belongsTo(models.Track, {
      foreignKey: 'track_id',
      as: 'track',
      onDelete: 'CASCADE',
    });
  };

  return FavoriteTrack;
}; 