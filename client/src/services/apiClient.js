import axios from 'axios';

// Создаем экземпляр axios с базовым URL
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 10000 // Таймаут запроса 10 секунд
});

// Добавляем состояние для отслеживания неудачных запросов
const failedRequests = new Map();
// Специальная обработка для критических эндпоинтов
const criticalEndpoints = [
  'get-/users/*/devices',
  'get-/playback/position',
];
const maxRetries = 3;
// Отслеживаем блокированные эндпоинты
const blockedEndpoints = new Set();

// Кеш для ответов критических запросов
const responseCache = new Map();
const cacheTTL = 60000; // 1 минута кеширования

// Функция для получения шаблонного эндпоинта из URL
const getEndpointPattern = (method, url) => {
  const urlParts = url.split('/');
  const patternUrlParts = [...urlParts];
  
  // Заменяем идентификаторы на '*' для шаблонизации URL
  for (let i = 0; i < urlParts.length; i++) {
    if (/^\d+$/.test(urlParts[i])) {
      patternUrlParts[i] = '*';
    }
  }
  
  const patternUrl = patternUrlParts.join('/').split('?')[0];
  return `${method}-${patternUrl}`;
};

// Перехватчик для добавления токена авторизации к запросам
apiClient.interceptors.request.use(
  (config) => {
    const endpoint = getEndpointPattern(config.method, config.url);
    
    // Блокировка запроса, если он был заблокирован ранее
    if (blockedEndpoints.has(endpoint)) {
      console.warn(`Запрос к ${endpoint} временно заблокирован до следующего обновления страницы`);
      return Promise.reject(new Error('Запрос заблокирован'));
    }

    // Проверка на блокировку запроса из-за предыдущих ошибок
    if (failedRequests.has(endpoint)) {
      const { count, timestamp } = failedRequests.get(endpoint);
      const now = Date.now();
      
      // Если запрос критический и было много ошибок, блокируем его полностью
      if (criticalEndpoints.some(pattern => 
          new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}$`).test(endpoint)) 
          && count >= maxRetries) {
        console.warn(`Критический запрос к ${endpoint} заблокирован из-за повторяющихся ошибок`);
        
        // Проверяем, есть ли кешированный ответ для этого эндпоинта
        if (responseCache.has(endpoint) && (now - responseCache.get(endpoint).timestamp < cacheTTL)) {
          const cachedData = responseCache.get(endpoint).data;
          console.log(`Используем кешированные данные для ${endpoint}`);
          return Promise.reject({
            __CACHED_RESPONSE__: true,
            data: cachedData
          });
        }
        
        blockedEndpoints.add(endpoint);
        return Promise.reject(new Error('Запрос заблокирован'));
      }
      
      // Если было много ошибок, блокируем запросы на некоторое время
      if (count >= maxRetries && (now - timestamp) < 60000) {
        console.warn(`Запрос к ${endpoint} временно заблокирован из-за предыдущих ошибок`);
        
        // Проверяем, есть ли кешированный ответ
        if (responseCache.has(endpoint) && (now - responseCache.get(endpoint).timestamp < cacheTTL)) {
          const cachedData = responseCache.get(endpoint).data;
          console.log(`Используем кешированные данные для ${endpoint}`);
          return Promise.reject({
            __CACHED_RESPONSE__: true,
            data: cachedData
          });
        }
        
        return Promise.reject(new Error('Слишком много ошибок для этого запроса'));
      }
      
      // Если прошло больше минуты с последней ошибки, сбрасываем счетчик
      if ((now - timestamp) > 60000) {
        failedRequests.delete(endpoint);
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик для обработки ошибок ответа
apiClient.interceptors.response.use(
  (response) => {
    // При успешном ответе удаляем запись о неудачных запросах
    const endpoint = getEndpointPattern(response.config.method, response.config.url);
    
    if (failedRequests.has(endpoint)) {
      failedRequests.delete(endpoint);
    }
    
    // Сохраняем ответ в кеш для критических эндпоинтов
    if (criticalEndpoints.some(pattern => 
        new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}$`).test(endpoint))) {
      responseCache.set(endpoint, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  (error) => {
    // Проверяем, не является ли это кешированным ответом
    if (error.__CACHED_RESPONSE__) {
      // Возвращаем кешированные данные как успешный ответ
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK (cached)',
        headers: {},
        config: {},
        cached: true
      });
    }
    
    // Не обрабатываем отмененные запросы или запросы, которые мы сами заблокировали
    if (axios.isCancel(error) || error.message === 'Запрос заблокирован') {
      return Promise.reject(error);
    }

    if (!error.config) {
      return Promise.reject(error);
    }

    // Получаем шаблонный эндпоинт
    const endpoint = getEndpointPattern(error.config.method, error.config.url);
    
    // Добавляем или обновляем запись о неудачном запросе
    if (!failedRequests.has(endpoint)) {
      failedRequests.set(endpoint, { count: 1, timestamp: Date.now() });
    } else {
      const entry = failedRequests.get(endpoint);
      failedRequests.set(endpoint, { 
        count: entry.count + 1, 
        timestamp: Date.now() 
      });
      
      // Проверяем, не нужно ли полностью заблокировать критический эндпоинт
      if (criticalEndpoints.some(pattern => 
          new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}$`).test(endpoint)) 
          && entry.count + 1 >= maxRetries) {
        console.warn(`Критический запрос к ${endpoint} заблокирован из-за повторяющихся ошибок`);
        blockedEndpoints.add(endpoint);
      }
    }

    // Обработка ошибки 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Если это не запрос на авторизацию, перенаправляем на страницу входа
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Функция очистки блокировок и кеша эндпоинтов
apiClient.clearBlockedEndpoints = () => {
  blockedEndpoints.clear();
  console.log('Блокировки эндпоинтов сброшены');
};

// Экспортируем измененный экземпляр axios
export default apiClient; 