const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100],
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
    avatar_path: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'avatar_path',
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_active',
    },
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    tableName: 'users',
    underscored: true,
  });

  // Метод для проверки пароля
  User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  // Ассоциации с другими моделями
  User.associate = (models) => {
    User.hasMany(models.Track, {
      foreignKey: 'userId',
      as: 'tracks',
    });
    
    User.hasMany(models.PlayHistory, {
      foreignKey: 'userId',
      as: 'playHistory',
    });
  };

  return User;
}; 