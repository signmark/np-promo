# 🔍 SEO Keyword Management & Trend Analysis Platform

Платформа для управления SEO кампаниями, анализа ключевых слов и предсказания трендов с интеграцией WordStat API.

## 📋 Возможности

- 🎯 **Управление кампаниями** - Создание и организация keyword-кампаний
- 🔑 **Поиск ключевых слов** - Интеграция с WordStat API для получения данных по ключевым словам
- 📊 **Анализ трендов** - Предсказание трендов и оценка потенциала роста
- 📈 **Статистика** - Данные о количестве показов и упоминаний
- ⚙️ **Настройки поиска** - Гибкая конфигурация параметров поиска (социальные сети, поисковики, типы контента)
- 🔐 **Аутентификация** - Безопасная авторизация через Directus

## 🛠 Технологический стек

### Frontend
- **React 18.3** с TypeScript
- **Vite** - быстрая сборка и dev server
- **Tailwind CSS** + **Radix UI** - современный UI/UX
- **TanStack Query** - управление состоянием сервера
- **React Hook Form** + **Zod** - валидация форм
- **Axios** - HTTP клиент

### Backend
- **Node.js** + **Express** + TypeScript
- **PostgreSQL** (Neon) - база данных
- **Drizzle ORM** - типобезопасная работа с БД
- **WordStat API** - данные по ключевым словам

## 📦 Установка

### Требования

- Node.js 18+
- npm или yarn
- PostgreSQL база данных (или Neon serverless)
- WordStat API credentials

### Шаг 1: Клонирование репозитория

\`\`\`bash
git clone <repository-url>
cd np-promo
\`\`\`

### Шаг 2: Установка зависимостей

\`\`\`bash
npm install
\`\`\`

### Шаг 3: Настройка Environment Variables

Создайте файл \`.env\` в корне проекта на основе \`.env.example\`:

\`\`\`bash
cp .env.example .env
\`\`\`

Заполните необходимые переменные:

\`\`\`env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# WordStat API Configuration
WORDSTAT_API_URL=http://xmlriver.com/wordstat/json
WORDSTAT_USER=your_wordstat_user_id
WORDSTAT_KEY=your_wordstat_api_key

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Secret (опционально - генерируется автоматически)
SESSION_SECRET=your_random_session_secret_here
\`\`\`

#### Получение WordStat API credentials

1. Зарегистрируйтесь на [WordStat](https://wordstat.yandex.ru/)
2. Получите API ключ и user ID
3. Добавьте их в \`.env\` файл

### Шаг 4: Настройка базы данных

Примените миграции к базе данных:

\`\`\`bash
npm run db:push
\`\`\`

## 🚀 Запуск проекта

### Development режим

\`\`\`bash
npm run dev
\`\`\`

Приложение будет доступно по адресу: http://localhost:5000

### Production сборка

\`\`\`bash
# Сборка приложения
npm run build

# Запуск production сервера
npm run start
\`\`\`

### Проверка типов

\`\`\`bash
npm run check
\`\`\`

## 📁 Структура проекта

\`\`\`
np-promo/
├── client/                    # Frontend приложение
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   │   ├── ui/           # UI компоненты (Radix UI)
│   │   │   ├── layout.tsx    # Главный layout
│   │   │   ├── error-boundary.tsx  # Error boundary
│   │   │   └── ...
│   │   ├── pages/            # Страницы приложения
│   │   │   ├── home-page.tsx
│   │   │   ├── auth-page.tsx
│   │   │   └── settings-page.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── use-auth.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/              # Утилиты и конфигурация
│   │   │   ├── directus.ts   # API клиент
│   │   │   ├── api-error-handler.ts
│   │   │   └── queryClient.ts
│   │   └── App.tsx           # Главный компонент
│
├── server/                    # Backend приложение
│   ├── middleware/           # Express middleware
│   │   └── error-handler.ts # Обработка ошибок
│   ├── index.ts             # Entry point сервера
│   ├── routes.ts            # API routes
│   ├── db.ts                # Database connection
│   └── storage.ts           # Session storage
│
├── shared/                   # Общий код
│   └── schema.ts            # Database schema + Zod validators
│
├── .env.example             # Пример переменных окружения
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── drizzle.config.ts
\`\`\`

## 🔑 API Endpoints

### WordStat

\`\`\`
GET /api/wordstat?keyword={keyword}
\`\`\`

Получает данные по ключевому слову из WordStat API.

**Query параметры:**
- \`keyword\` (required) - ключевое слово для поиска

**Response:**
\`\`\`json
{
  "response": {
    "data": {
      "shows": [{ "shows": 1000 }],
      "sources": [{ "count": 1000 }]
    }
  },
  "content": {
    "includingPhrases": {
      "items": [
        {
          "phrase": "keyword example",
          "number": "1 000"
        }
      ]
    }
  }
}
\`\`\`

## 🗄 База данных

### Schema

Проект использует Drizzle ORM со следующими таблицами:

- \`user_campaigns\` - Кампании пользователей
- \`user_keywords\` - Ключевые слова
- \`user_keywords_campaigns\` - Связь many-to-many между keywords и campaigns

### Миграции

\`\`\`bash
# Применить изменения схемы к БД
npm run db:push

# Генерация миграций (если настроено)
npx drizzle-kit generate

# Применение миграций
npx drizzle-kit migrate
\`\`\`

## 🔒 Безопасность

### Environment Variables

⚠️ **ВАЖНО:** Никогда не коммитьте файл \`.env\` в репозиторий!

Все чувствительные данные (API ключи, пароли БД) хранятся в environment variables.

### Authentication

Проект использует:
- Token-based аутентификацию через Directus
- Refresh tokens для обновления сессии
- Protected routes для авторизованных пользователей

### Error Handling

- **Client-side:** React Error Boundary для перехвата ошибок компонентов
- **Server-side:** Централизованный error handler middleware
- **API errors:** Типизированная обработка ошибок с понятными сообщениями

## 🧪 Тестирование

// TODO: Добавить тесты
\`\`\`bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
\`\`\`

## 📝 Разработка

### Добавление нового API endpoint

1. Добавьте route в \`server/routes.ts\`
2. Используйте \`asyncHandler\` для автоматической обработки ошибок
3. При необходимости создайте новую \`ApiError\` для специфичных ошибок

\`\`\`typescript
import { asyncHandler, ApiError } from "./middleware/error-handler";

app.get('/api/example', asyncHandler(async (req, res) => {
  if (!req.query.param) {
    throw new ApiError('Parameter required', 400, 'MISSING_PARAM');
  }

  const result = await someAsyncOperation();
  res.json(result);
}));
\`\`\`

### Добавление новой страницы

1. Создайте компонент в \`client/src/pages/\`
2. Добавьте route в \`client/src/App.tsx\`
3. При необходимости добавьте \`ProtectedRoute\` для авторизации

### Работа с формами

Используйте React Hook Form + Zod:

\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
\`\`\`

## 🐛 Troubleshooting

### База данных не подключается

Проверьте:
1. \`DATABASE_URL\` в \`.env\` файле правильный
2. База данных запущена и доступна
3. Применены миграции: \`npm run db:push\`

### WordStat API не работает

Проверьте:
1. \`WORDSTAT_USER\` и \`WORDSTAT_KEY\` в \`.env\` правильные
2. У вас есть активная подписка на WordStat API
3. API endpoint доступен

### Port уже используется

Измените \`PORT\` в \`.env\` файле или остановите процесс на порту 5000:

\`\`\`bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
\`\`\`

## 📄 License

MIT

## 🤝 Contributing

// TODO: Добавить contributing guidelines

## 📧 Контакты

// TODO: Добавить контакты для связи
\`\`\`

---

Made with ❤️ using React, TypeScript, and Express
