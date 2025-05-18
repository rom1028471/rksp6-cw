@echo off
echo Запуск сервера аудио-стриминга...

cd %~dp0
cd ../server

:: Создаем файл .env если его нет
if not exist .env (
  echo PORT=5000 > .env
  echo NODE_ENV=development >> .env
  echo JWT_SECRET=a128d3dc-58b2-4e73-b7bf-68fb4c8e7123 >> .env
  echo DB_HOST=localhost >> .env
  echo DB_USER=postgres >> .env
  echo DB_PASS=postgres >> .env
  echo DB_NAME=audio_streaming >> .env
  echo CORS_ORIGIN=http://localhost:3000 >> .env
  echo UPLOAD_DIR=uploads >> .env
  echo STREAM_DIR=streams >> .env
  echo Создан файл .env с настройками по умолчанию
)

:: Создаем директории для загрузки файлов, если их нет
if not exist uploads mkdir uploads
if not exist streams mkdir streams

:: Запускаем сервер
echo Запуск сервера на порту 5000...
npm run dev

echo Сервер остановлен. 