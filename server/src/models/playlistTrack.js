module.exports = (sequelize, DataTypes) => {
  const PlaylistTrack = sequelize.define('PlaylistTrack', {
    playlist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'playlist_id',
    },
    track_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'track_id',
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    added_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'added_at',
    }
  }, {
    tableName: 'playlist_tracks',
    underscored: true,
    timestamps: false
  });

  // Ассоциации с другими моделями
  PlaylistTrack.associate = (models) => {
    PlaylistTrack.belongsTo(models.Playlist, {
      foreignKey: 'playlist_id',
    });
    
    PlaylistTrack.belongsTo(models.Track, {
      foreignKey: 'track_id',
    });
  };

  return PlaylistTrack;
}; 