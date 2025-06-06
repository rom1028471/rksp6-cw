const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { authFuzzer, trackFuzzer, playlistFuzzer } = require('./api.fuzzing');

// Проверяем наличие Jazzer.js
try {
  require('@jazzer.js/core');
} catch (e) {
  console.error('Ошибка: @jazzer.js/core не установлен. Установите его с помощью npm install @jazzer.js/core');
  process.exit(1);
}

// Создаем корпус для фаззинга, если его нет
const CORPUS_DIR = path.join(__dirname, 'corpus');
if (!fs.existsSync(CORPUS_DIR)) {
  fs.mkdirSync(CORPUS_DIR, { recursive: true });
  
  // Создаем начальные тестовые данные
  fs.writeFileSync(path.join(CORPUS_DIR, 'auth1'), 'testuser@example.com:password123');
  fs.writeFileSync(path.join(CORPUS_DIR, 'track1'), 'track123:Rock:Artist1');
  fs.writeFileSync(path.join(CORPUS_DIR, 'playlist1'), 'playlist123:MyPlaylist:10');
}

// Функция для запуска фаззинг-тестов
function runFuzzer(fuzzerName, fuzzerFunction) {
  return new Promise((resolve, reject) => {
    const jazzerPath = require.resolve('@jazzer.js/core/bin/jazzer.js');
    const args = [
      '--sync',
      '-max_total_time=60',
      `-corpus=${path.join(CORPUS_DIR, fuzzerName)}`,
      `-target_function=${fuzzerFunction.name}`,
      path.join(__dirname, 'api.fuzzing.js')
    ];
    
    console.log(`Запуск фаззинг-теста для ${fuzzerName}...`);
    console.log(`Команда: node ${jazzerPath} ${args.join(' ')}`);
    
    const process = exec(`node "${jazzerPath}" ${args.join(' ')}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Ошибка при запуске фаззера ${fuzzerName}:`, error);
        reject(error);
        return;
      }
      
      console.log(`Вывод фаззера ${fuzzerName}:`, stdout);
      
      if (stderr) {
        console.warn(`Предупреждения фаззера ${fuzzerName}:`, stderr);
      }
      
      resolve();
    });
  });
}

// Последовательно запускаем все фаззеры
async function runAllFuzzers() {
  try {
    console.log('Начало фаззинг-тестирования...');
    
    await runFuzzer('auth', authFuzzer);
    await runFuzzer('track', trackFuzzer);
    await runFuzzer('playlist', playlistFuzzer);
    
    console.log('Фаззинг-тестирование завершено успешно!');
  } catch (error) {
    console.error('Фаззинг-тестирование завершилось с ошибкой:', error);
    process.exit(1);
  }
}

// Запускаем тесты
runAllFuzzers(); 