const { spawn, execSync } = require('child_process');
const path = require('path');

// Функция для выполнения команды и вывода результата
function runCommand(command, args = []) {
  console.log(`Выполняем: ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Процесс завершился с кодом ${code}`));
      }
    });
  });
}

async function main() {
  try {
    console.log('Применяем миграции...');
    // Используем Sequelize CLI для запуска миграций
    await runCommand('npx', ['sequelize-cli', 'db:migrate']);

    console.log('Проверяем структуру таблицы users...');
    await runCommand('node', ['checkUsersTable.js']);

    console.log('Добавляем колонку last_active, если её нет...');
    await runCommand('node', ['addLastActiveColumn.js']);

    console.log('Запускаем сервер с новым портом 5001...');
    // Устанавливаем переменную окружения с новым портом
    process.env.PORT = 5000;
    await runCommand('npm', ['run', 'dev']);
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

main(); 