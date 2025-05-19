import apiClient from './apiClient';

/**
 * Сервис для аутентификации пользователей
 */
class AuthService {
  constructor() {
    // Кеш для хранения данных о устройствах
    this.devicesCache = new Map();
    this.cacheTime = 300000; // 5 минут - время жизни кеша
  }

  /**
   * Регистрирует нового пользователя
   * @param {Object} userData - Данные пользователя (username, email, password)
   * @returns {Promise<Object>} - Объект с информацией о пользователе и токеном
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    
    // Сохраняем токен в localStorage
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  }
  
  /**
   * Авторизует пользователя
   * @param {Object} credentials - Учетные данные (email, password, deviceId, deviceName, deviceType)
   * @returns {Promise<Object>} - Объект с информацией о пользователе и токеном
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    
    // Сохраняем токен в localStorage
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  }
  
  /**
   * Выход пользователя
   * @param {Object} deviceInfo - Информация об устройстве (deviceId)
   * @returns {Promise<Object>} - Сообщение об успешном выходе
   */
  async logout(deviceInfo) {
    const response = await apiClient.post('/auth/logout', deviceInfo);
    
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    
    // Очищаем кеш устройств
    this.devicesCache.clear();
    
    return response.data;
  }
  
  /**
   * Проверяет валидность токена
   * @param {string} token - JWT токен
   * @returns {Promise<Object>} - Объект с информацией о пользователе
   */
  async validateToken(token) {
    const response = await apiClient.post('/auth/validate', { token });
    return response.data;
  }
  
  /**
   * Получает информацию о текущем пользователе
   * @returns {Promise<Object>} - Объект с информацией о пользователе
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
  
  /**
   * Обновляет профиль пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} userData - Новые данные пользователя
   * @returns {Promise<Object>} - Обновленный объект пользователя
   */
  async updateProfile(userId, userData) {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  }
  
  /**
   * Обновляет аватар пользователя
   * @param {string} userId - ID пользователя
   * @param {File} file - Файл изображения
   * @returns {Promise<Object>} - Обновленный объект пользователя
   */
  async updateAvatar(userId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.put(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
  
  /**
   * Изменяет пароль пользователя
   * @param {string} userId - ID пользователя
   * @param {string} oldPassword - Старый пароль
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<Object>} - Сообщение об успешном изменении пароля
   */
  async changePassword(userId, oldPassword, newPassword) {
    const response = await apiClient.put(`/users/${userId}/password`, {
      oldPassword,
      newPassword,
    });
    
    return response.data;
  }
  
  /**
   * Получает список устройств пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} - Массив устройств пользователя
   */
  async getUserDevices(userId) {
    // Проверяем кеш
    const cacheKey = `devices_${userId}`;
    const cacheData = this.devicesCache.get(cacheKey);
    
    if (cacheData && (Date.now() - cacheData.timestamp < this.cacheTime)) {
      console.log('Используем кешированные данные устройств пользователя');
      return cacheData.data;
    }
    
    try {
      console.log('Запрашиваем устройства пользователя с сервера');
      const response = await apiClient.get(`/users/${userId}/devices`);
      
      // Кешируем результат
      const devices = response.data;
      this.devicesCache.set(cacheKey, {
        data: devices,
        timestamp: Date.now()
      });
      
      return devices;
    } catch (error) {
      if (error?.response?.status === 403) {
        console.warn('Нет прав доступа к устройствам пользователя, используем пустой список');
        // В случае ошибки прав доступа, кешируем пустой массив, чтобы не делать повторные запросы
        this.devicesCache.set(cacheKey, {
          data: [],
          timestamp: Date.now()
        });
        return [];
      }
      throw error;
    }
  }
  
  /**
   * Очищает кеш сервиса
   */
  clearCache() {
    this.devicesCache.clear();
    console.log('Кеш authService очищен');
  }
}

export default new AuthService(); 