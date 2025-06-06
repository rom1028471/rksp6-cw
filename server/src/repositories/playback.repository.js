const { PlaybackPosition, Track, User, Genre } = require('../models');

class PlaybackRepository {
  /**
   * Находит или создает запись о позиции воспроизведения для пользователя и трека.
   * @param {number} userId - ID пользователя.
   * @param {number} trackId - ID трека.
   * @returns {Promise<PlaybackPosition>}
   */
  async findOrCreatePosition(userId, trackId) {
    const [position] = await PlaybackPosition.findOrCreate({
      where: { user_id: userId, track_id: trackId },
      defaults: { position: 0 },
    });
    return position;
  }

  /**
   * Обновляет позицию воспроизведения для пользователя.
   * @param {number} userId - ID пользователя.
   * @param {number} trackId - ID трека.
   * @param {number} position - Позиция в секундах.
   * @returns {Promise<[number]>}
   */
  async updatePosition(userId, trackId, position) {
    return await PlaybackPosition.update(
      { position },
      { where: { user_id: userId, track_id: trackId } }
    );
  }

  /**
   * Получает последнюю сохраненную позицию для пользователя.
   * @param {number} userId - ID пользователя.
   * @returns {Promise<PlaybackPosition|null>}
   */
  async getLastPosition(userId) {
    return await PlaybackPosition.findOne({
      where: { user_id: userId },
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: Track,
          as: 'track',
          include: [
            { model: User, as: 'user', attributes: ['id', 'username'] },
            { model: Genre, as: 'genreInfo', attributes: ['id', 'name'] },
          ],
        },
      ],
    });
  }
}

module.exports = new PlaybackRepository(); 