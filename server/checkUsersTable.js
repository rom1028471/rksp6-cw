const { sequelize } = require('./src/models');

async function checkUsersTable() {
  try {
    const [result] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Структура таблицы users:');
    console.log(result);
  } catch (err) {
    console.error('Ошибка при проверке таблицы users:', err);
  } finally {
    await sequelize.close();
  }
}

checkUsersTable(); 