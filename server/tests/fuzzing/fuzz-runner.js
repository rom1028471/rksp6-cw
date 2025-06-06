require('dotenv').config();
const axios = require('axios').default;
const crypto = require('crypto');
const fuzzers = require('./fuzz-logic');
const request = require('supertest');
const puppeteer = require('puppeteer');
const baseUrl = 'http://localhost:5000';
const frontendUrl = 'http://localhost:3000';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerAvailability(url, name) {
  try {
    await axios.get(url, { timeout: 3000 });
    return true;
  } catch (error) {
    console.error(`Ошибка: ${name} сервер не доступен по адресу ${url}. Запустите его перед тестированием.`);
    return false;
  }
}

async function takeScreenshot(filePath) {
    console.log(`\nСоздание скриншота: ${filePath}...`);
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(frontendUrl, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: filePath });
        console.log(`Скриншот успешно сохранен.`);
    } catch (e) {
        console.error(`Не удалось сделать скриншот: ${e.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function runRealisticFuzzer(totalRequests = 500) {
  const startTime = new Date();
  console.log(`НАЧАЛО ФАЗЗИНГ-ТЕСТИРОВАНИЯ: ${startTime.toLocaleString()}`);
  console.log(`Тестируем API на ${baseUrl} и фронтенд на ${frontendUrl}...`);
  
  const backendOk = await checkServerAvailability(`${baseUrl}/api/health`, 'Бэкенд');
  const frontendOk = await checkServerAvailability(frontendUrl, 'Фронтенд');

  if (!backendOk || !frontendOk) {
    return;
  }

  await takeScreenshot('fuzzing-before.png');

  console.log("\nВыполнение фаззинг-атак...");
  const processingStartTime = Date.now();
  const stats = {
    total: totalRequests,
    successful: 0,
    failed: 0,
  };

  const allFuzzers = Object.values(fuzzers);

  for (let i = 0; i < totalRequests; i++) {
    const useValidRequest = Math.random() < 0.75;
    try {
      if (useValidRequest) {
        await request(baseUrl).get('/api/tracks?limit=5').send();
      } else {
        const selectedFuzzer = allFuzzers[Math.floor(Math.random() * allFuzzers.length)];
        const testData = crypto.randomBytes(32);
        await selectedFuzzer(testData);
      }
      stats.successful++;
    } catch (e) {
      stats.failed++;
    }
    await delay(25);
  }

  const endTime = Date.now();
  const executionTimeSec = ((endTime - processingStartTime) / 1000).toFixed(2);
  const successPercent = stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(2) : "0.00";
  
  await takeScreenshot('fuzzing-after.png');

  console.log("\n==== РЕЗУЛЬТАТЫ ФАЗЗИНГ-ТЕСТИРОВАНИЯ ====");
  console.log(`Всего запросов:      ${stats.total}`);
  console.log(`Успешно обработано:  ${stats.successful} (${successPercent}%)`);
  console.log(`Время выполнения:    ${executionTimeSec} секунд`);
  console.log("========================================");
  console.log("\nФАЗЗИНГ-ТЕСТИРОВАНИЕ ЗАВЕРШЕНО");
  console.log("Сравните файлы 'fuzzing-before.png' и 'fuzzing-after.png', чтобы увидеть изменения на сайте.");
}

runRealisticFuzzer(500).catch(error => {
  console.error('\nФаззинг-тестирование завершилось с критической ошибкой:', error);
}); 