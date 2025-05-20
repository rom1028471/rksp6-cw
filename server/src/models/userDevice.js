module.exports = (sequelize, DataTypes) => {
  const UserDevice = sequelize.define('UserDevice', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    device_id: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_id',
    },
    device_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_name',
    },
    device_type: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_type',
    },
    last_active: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_active',
    },
  }, {
    tableName: 'user_devices',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'device_id'],
      },
    ],
  });

  // Ассоциации с другими моделями
  UserDevice.associate = (models) => {
    UserDevice.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return UserDevice;
}; 