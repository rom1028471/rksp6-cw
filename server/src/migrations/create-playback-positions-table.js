'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('playback_positions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      device_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      track_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tracks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      is_playing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем уникальный индекс для комбинации user_id, device_id
    await queryInterface.addIndex('playback_positions', ['user_id', 'device_id'], {
      unique: true,
      name: 'playback_positions_user_device_unique'
    });

    // Добавляем индекс для ускорения поиска
    await queryInterface.addIndex('playback_positions', ['user_id'], {
      name: 'idx_playback_positions_user_id'
    });
    
    await queryInterface.addIndex('playback_positions', ['updated_at'], {
      name: 'idx_playback_positions_updated_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('playback_positions');
  }
}; 