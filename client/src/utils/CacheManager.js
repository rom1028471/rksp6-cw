/**
 * Класс для управления кэшированием аудио файлов
 */
class CacheManager {
  constructor() {
    this.storeName = 'audio-cache';
    this.dbName = 'audio-streaming-cache';
    this.dbVersion = 1;
    this.db = null;
    
    // Инициализация IndexedDB
    this.init();
  }
  
  /**
   * Инициализация базы данных IndexedDB
   */
  init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('Ваш браузер не поддерживает IndexedDB. Кэширование недоступно.');
        reject('IndexedDB не поддерживается');
        return;
      }
      
      const request = window.indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('Ошибка при открытии базы данных:', event);
        reject('Ошибка при открытии базы данных');
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('База данных кэширования успешно открыта');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Создаем хранилище объектов для кэширования
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
          console.log('Создано хранилище объектов для кэширования аудио');
        }
      };
    });
  }
  
  /**
   * Кэширование аудио трека
   * @param {Object} track - Трек для кэширования
   * @param {ArrayBuffer} audioData - Данные аудио файла
   * @returns {Promise<boolean>} - Результат кэширования
   */
  async cacheTrack(track, audioData) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Добавляем трек и его данные в кэш
      const request = store.put({
        id: track.id,
        track,
        audioData,
        cachedAt: new Date(),
      });
      
      request.onsuccess = () => {
        console.log(`Трек "${track.title}" успешно кэширован`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Ошибка при кэшировании трека "${track.title}":`, event);
        reject(event);
      };
    });
  }
  
  /**
   * Получение кэшированного трека
   * @param {string} trackId - ID трека
   * @returns {Promise<Object|null>} - Кэшированный трек или null, если трек не найден
   */
  async getTrack(trackId) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      // Запрос трека из кэша
      const request = store.get(trackId);
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        if (result) {
          console.log(`Трек с ID ${trackId} получен из кэша`);
          resolve(result);
        } else {
          console.log(`Трек с ID ${trackId} не найден в кэше`);
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error(`Ошибка при получении трека с ID ${trackId} из кэша:`, event);
        reject(event);
      };
    });
  }
  
  /**
   * Удаление трека из кэша
   * @param {string} trackId - ID трека
   * @returns {Promise<boolean>} - Результат удаления
   */
  async removeTrack(trackId) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Удаляем трек из кэша
      const request = store.delete(trackId);
      
      request.onsuccess = () => {
        console.log(`Трек с ID ${trackId} удален из кэша`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Ошибка при удалении трека с ID ${trackId} из кэша:`, event);
        reject(event);
      };
    });
  }
  
  /**
   * Получение всех кэшированных треков
   * @returns {Promise<Array>} - Массив кэшированных треков
   */
  async getAllTracks() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      // Получаем все треки из кэша
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        console.log(`Получено ${result.length} треков из кэша`);
        resolve(result);
      };
      
      request.onerror = (event) => {
        console.error('Ошибка при получении всех треков из кэша:', event);
        reject(event);
      };
    });
  }
  
  /**
   * Очистка кэша
   * @returns {Promise<boolean>} - Результат очистки
   */
  async clearCache() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Очищаем хранилище
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('Кэш успешно очищен');
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Ошибка при очистке кэша:', event);
        reject(event);
      };
    });
  }
}

// export default new CacheManager(); // Старый вариант
const instance = new CacheManager();
export default instance; 