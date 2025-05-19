const { sequelize } = require('./src/models');

async function addLastActiveColumn() {
  try {
    // Проверяем, существует ли уже колонка last_active
    const [checkResult] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_active'
    `);

    if (checkResult.length === 0) {
      console.log('Добавляем колонку last_active в таблицу users...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN last_active TIMESTAMP WITH TIME ZONE
      `);
      console.log('Колонка last_active успешно добавлена');
    } else {
      console.log('Колонка last_active уже существует');
    }
  } catch (err) {
    console.error('Ошибка при добавлении колонки:', err);
  } finally {
    await sequelize.close();
  }
}

addLastActiveColumn(); 