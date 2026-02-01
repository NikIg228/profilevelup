# Развертывание фронта и бэкенда

Краткое руководство по развертыванию ProfiLevelUp.

---

## 🎯 Архитектура

**Рекомендуемая архитектура:**

- **Фронт**: Netlify/Vercel (CDN) — статические файлы React
- **Бэкенд**: VPS (Python API) — генерация PDF, БД, email

**Подробнее:** см. `pb_backend/docs/DEPLOYMENT_ARCHITECTURE.md`

---

## 📦 Развертывание фронта (Netlify)

### 1. Подготовка

1. Убедитесь, что проект собирается:
   ```bash
   npm run build
   ```

2. Проверьте `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   ```

### 2. Подключение к Netlify

1. Зайдите на [netlify.com](https://netlify.com)
2. Подключите репозиторий GitHub/GitLab
3. Настройте build:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. Переменные окружения

В настройках Netlify добавьте:

```
VITE_API_BASE_URL=https://api.profi-level.com/api
```

(Замените на ваш реальный URL бэкенда)

### 4. Домен

- Используйте дефолтный домен Netlify: `your-site.netlify.app`
- Или подключите свой домен: `profi-level.com`

### 5. Deploy

После каждого push в `main`/`master` Netlify автоматически деплоит.

---

## 🖥️ Развертывание бэкенда (VPS)

### Требования VPS

- ОС: Ubuntu 22.04 LTS или Debian 12
- RAM: минимум 2GB (рекомендуется 4GB)
- CPU: минимум 2 ядра
- Диск: минимум 20GB SSD
- Python: 3.10+

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка базовых пакетов
sudo apt install python3.10 python3-pip python3-venv nginx postgresql git -y
```

### 2. Создание структуры проекта

```bash
# Создать директорию для проекта
sudo mkdir -p /var/www/profi-backend
sudo chown $USER:$USER /var/www/profi-backend
cd /var/www/profi-backend

# Клонировать репозиторий (или загрузить файлы)
git clone <your-repo-url> .
```

### 3. Установка зависимостей

```bash
# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
```

### 4. Настройка переменных окружения

Создать `.env` файл:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/profi_db

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
EMAIL_FROM=noreply@profi-level.com

# Paths
MODULES_PATH=./modules
TEMPLATE_PATH=./templates/template_main.docx
OUTPUT_PATH=./output

# API
API_HOST=0.0.0.0
API_PORT=8000
```

### 5. Настройка Nginx (reverse proxy)

Создать `/etc/nginx/sites-available/profi-backend`:

```nginx
server {
    listen 80;
    server_name api.profi-level.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активировать:

```bash
sudo ln -s /etc/nginx/sites-available/profi-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.profi-level.com
```

### 7. Systemd service

Создать `/etc/systemd/system/profi-backend.service`:

```ini
[Unit]
Description=ProfiLevelUp Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/profi-backend
Environment="PATH=/var/www/profi-backend/venv/bin"
ExecStart=/var/www/profi-backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Запустить:

```bash
sudo systemctl daemon-reload
sudo systemctl enable profi-backend
sudo systemctl start profi-backend
sudo systemctl status profi-backend
```

---

## 🔧 Настройка CORS

Если фронт и бэкенд на разных доменах, настройте CORS на бэкенде:

```python
# FastAPI пример
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://profi-level.com",
        "https://www.profi-level.com",
        "http://localhost:5173",  # Для разработки
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ Проверка

### Фронт

1. Откройте сайт: `https://profi-level.com`
2. Проверьте консоль браузера (F12) — не должно быть ошибок CORS
3. Попробуйте пройти тест — запросы должны уходить на бэкенд

### Бэкенд

1. Проверьте health endpoint:
   ```bash
   curl https://api.profi-level.com/api/health
   ```

2. Проверьте логи:
   ```bash
   sudo journalctl -u profi-backend -f
   ```

3. Проверьте Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

---

## 🐛 Troubleshooting

### CORS ошибки

- Проверьте `allow_origins` в CORS middleware
- Убедитесь, что домен фронта добавлен в список

### 404 на API endpoints

- Проверьте, что Nginx правильно проксирует запросы
- Проверьте, что API сервер запущен: `sudo systemctl status profi-backend`

### Ошибки генерации PDF

- Проверьте, что модули .docx находятся в правильной директории
- Проверьте права доступа к файлам: `ls -la /var/www/profi-backend/modules`

---

## 📚 Дополнительно

- **Архитектура**: `pb_backend/docs/DEPLOYMENT_ARCHITECTURE.md`
- **API спецификация**: `docs/API_SPEC.md`
- **Payload спецификация**: `docs/PAYLOAD_V1_SPEC.md`
