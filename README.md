# Аудио Стриминг

Приложение для потоковой передачи аудио с поддержкой HLS и синхронизацией между устройствами.

## Локальная установка и запуск

Для работы приложения необходимо установить:

1. Node.js (версия 18 или выше)
2. PostgreSQL (версия 12 или выше)

### Шаги установки:

1. Клонировать репозиторий:
```
git clone https://github.com/your-username/rksp6-cw-master.git
cd rksp6-cw-master
```

2. Настройка сервера:
   - Перейдите в директорию `server`: `cd server`
   - Создайте файл `.env` в директории `server` по примеру файла `.env.example` (если он есть) или со следующими переменными:
     ```
     PORT=5000
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=audio_streaming
     DB_USER=postgres
     DB_PASSWORD=your_db_password
     JWT_SECRET=your_random_jwt_secret
     CORS_ORIGIN=http://localhost:3000
     ```
   - Установите зависимости: `npm install`

3. Настройка клиента:
   - Перейдите в директорию `client`: `cd ../client`
   - Установите зависимости: `npm install`

### Запуск

#### Сервер:
```bash
# В директории server
npm run dev
```
Сервер будет доступен по адресу `http://localhost:5000`.

#### Клиент:
```bash
# В директории client
npm start
```
Клиент будет доступен по адресу `http://localhost:3000`.

---

## Хостинг (Render)

Этот проект настроен для развертывания на платформе **Render** с использованием **Cloudinary** для хранения медиафайлов.

### Необходимые аккаунты:
1.  **Render**: [https://render.com/](https://render.com/)
2.  **Cloudinary**: [https://cloudinary.com/](https://cloudinary.com/)
3.  **GitHub**: Убедитесь, что ваш проект загружен в репозиторий на GitHub.

### Шаги развертывания:

1.  **Настройте Cloudinary:**
    *   Зарегистрируйтесь и войдите в свой аккаунт Cloudinary.
    *   Перейдите в **Dashboard**. Вы увидите свои `Cloud Name`, `API Key`, и `API Secret`. Эти значения понадобятся вам на следующем шаге.

2.  **Обновите `render.yaml`:**
    *   Откройте файл `render.yaml` в корне проекта.
    *   Найдите и замените `https://github.com/your-repo/rksp6-cw-master` на URL вашего собственного GitHub репозитория.

3.  **Разверните на Render:**
    *   Перейдите в **Dashboard** на Render.
    *   Нажмите **New +** и выберите **Blueprint**.
    *   Подключите свой GitHub репозиторий, где находится проект.
    *   Выберите нужный репозиторий и нажмите **Connect**.
    *   Render автоматически обнаружит `render.yaml` и предложит создать сервисы. Имя группы сервисов можно оставить по умолчанию.
    *   Нажмите **Apply**.

4.  **Настройте переменные окружения:**
    *   После создания сервисов перейдите в **Dashboard**, найдите ваш новый сервис `audio-streaming-server`.
    *   Перейдите на вкладку **Environment**.
    *   В разделе **Secret Files & Env Var Groups** вам нужно добавить переменные окружения, которые не хранятся в `render.yaml` (`sync: false`).
    *   Нажмите **Add Environment Variable** или **Add Secret File** и добавьте следующие переменные, используя значения из вашего Cloudinary Dashboard:
        *   `CLOUDINARY_CLOUD_NAME`
        *   `CLOUDINARY_API_KEY`
        *   `CLOUDINARY_API_SECRET`
    *   Render автоматически перезапустит сервис с новыми переменными.

После выполнения этих шагов ваш проект будет развернут и доступен. Бэкенд будет работать по адресу, сгенерированному Render (например, `https://audio-streaming-server.onrender.com`), а фронтенд будет доступен по своему адресу (`https://audio-streaming-client.onrender.com`).
