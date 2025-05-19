const { Sequelize } = require('sequelize');
const config = require('./config');

// Инициализация соединения с базой данных
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: false,
  }
);

async function checkTables() {
  try {
    // Проверяем соединение
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено успешно.');

    // Получаем информацию о таблице users
    const [usersTable] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Структура таблицы users:');
    console.log(usersTable);

    // Получаем информацию о таблице tracks
    const [tracksTable] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tracks'
    `);
    console.log('Структура таблицы tracks:');
    console.log(tracksTable);

    // Список всех таблиц
    const [allTables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('Список всех таблиц:');
    console.log(allTables.map(t => t.table_name));

  } catch (error) {
    console.error('Ошибка при проверке таблиц:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables(); 