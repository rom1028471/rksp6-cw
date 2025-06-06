const { exec } = require('child_process');
const { seedDatabase } = require('./src/utils/seedData');
const db = require('./src/models');

// Функция для запуска команды
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n> Выполняем: ${command}\n`);
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      if (error) {
        console.error(`Ошибка выполнения команды: ${error.message}`);
        reject(error);
        return;
      }
      
      resolve();
    });
  });
}

async function runAllTests() {
  try {
    console.log('======= НАЧАЛО ТЕСТИРОВАНИЯ =======');

    // 1. Подготавливаем базу данных
    console.log('\n======= ПОДГОТОВКА БАЗЫ ДАННЫХ =======');
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: true });
    await seedDatabase();
    console.log('База данных подготовлена успешно!');

    // 2. Запускаем юнит тесты
    console.log('\n======= ЗАПУСК ЮНИТ ТЕСТОВ =======');
    await runCommand('npx jest --testMatch="**/unit/*.test.js" --verbose');
    
    // 3. Запускаем тесты ролевой модели
    console.log('\n======= ЗАПУСК ТЕСТОВ РОЛЕВОЙ МОДЕЛИ =======');
    await runCommand('npx jest --testMatch="**/role.validation.test.js" --verbose');
    
    // 4. Запускаем интеграционные тесты
    console.log('\n======= ЗАПУСК ИНТЕГРАЦИОННЫХ ТЕСТОВ =======');
    await runCommand('npx jest --testMatch="**/integration/*.test.js" --verbose');
    
    // 5. Запускаем фаззинг-тесты
    console.log('\n======= ЗАПУСК ФАЗЗИНГ-ТЕСТОВ =======');
    await runCommand('node tests/fuzzing/runner.js');
    
    console.log('\n======= ВСЕ ТЕСТЫ УСПЕШНО ВЫПОЛНЕНЫ =======');
    
  } catch (error) {
    console.error('\n======= ОШИБКА ВЫПОЛНЕНИЯ ТЕСТОВ =======');
    console.error(error);
    process.exit(1);
  } finally {
    // Закрываем соединение с базой данных
    await db.sequelize.close();
    process.exit(0);
  }
}

// Запускаем все тесты
runAllTests(); 