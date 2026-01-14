# Database Migrations Guide

Этот проект использует Drizzle ORM для управления миграциями базы данных с версионированием.

## Команды для работы с миграциями

### 📝 Генерация миграций

Когда вы изменяете schema в `shared/schema.ts`, сгенерируйте новую миграцию:

\`\`\`bash
npm run db:generate
\`\`\`

Эта команда:
- Анализирует изменения в schema
- Создает SQL файл миграции в папке `migrations/`
- Присваивает уникальное имя с timestamp

### 🚀 Применение миграций

Применить все неприменённые миграции к базе данных:

\`\`\`bash
npm run db:migrate
\`\`\`

### ⚡ Push schema (для разработки)

Быстрое применение изменений schema без создания файла миграции:

\`\`\`bash
npm run db:push
\`\`\`

⚠️ **Внимание:** Используйте `db:push` только для локальной разработки! Для production всегда используйте версионированные миграции.

### 🎨 Drizzle Studio

Открыть визуальный редактор базы данных:

\`\`\`bash
npm run db:studio
\`\`\`

## Workflow для изменений схемы

### Development (локальная разработка)

1. Измените schema в `shared/schema.ts`
2. Примените изменения: `npm run db:push`
3. Протестируйте изменения

### Staging/Production

1. Измените schema в `shared/schema.ts`
2. Сгенерируйте миграцию: `npm run db:generate`
3. Проверьте созданный SQL файл в `migrations/`
4. Закоммитьте миграцию в git
5. На сервере примените миграцию: `npm run db:migrate`

## Пример: Добавление новой таблицы

### Шаг 1: Обновите schema

\`\`\`typescript
// shared/schema.ts
export const newTable = pgTable("new_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
\`\`\`

### Шаг 2: Сгенерируйте миграцию

\`\`\`bash
npm run db:generate
\`\`\`

Будет создан файл типа `migrations/0001_add_new_table.sql`:

\`\`\`sql
CREATE TABLE "new_table" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);
\`\`\`

### Шаг 3: Примените миграцию

\`\`\`bash
npm run db:migrate
\`\`\`

## Откат миграций

Drizzle Kit пока не поддерживает автоматический откат миграций. Для отката:

1. Создайте ручную миграцию с обратными изменениями
2. Примените её через `db:migrate`

Пример отката (создайте вручную):

\`\`\`sql
-- migrations/0002_rollback_new_table.sql
DROP TABLE IF EXISTS "new_table";
\`\`\`

## Best Practices

### ✅ DO

- Всегда генерируйте миграции для production
- Проверяйте сгенерированный SQL перед применением
- Коммитьте миграции в git
- Используйте осмысленные имена для таблиц и колонок
- Тестируйте миграции на staging перед production

### ❌ DON'T

- Не используйте `db:push` в production
- Не редактируйте уже применённые миграции
- Не удаляйте старые миграции из папки `migrations/`
- Не применяйте миграции вручную через SQL клиент (используйте `db:migrate`)

## Структура файлов

\`\`\`
migrations/
├── 0000_initial_schema.sql          # Первая миграция
├── 0001_add_campaigns_table.sql     # Добавление кампаний
├── 0002_add_keywords_relations.sql  # Связи keywords
├── meta/
│   ├── _journal.json                # Журнал миграций
│   └── 0000_snapshot.json           # Snapshots схемы
└── .gitkeep
\`\`\`

## Troubleshooting

### Миграция не применяется

Проверьте:
1. DATABASE_URL правильный в `.env`
2. У пользователя БД есть права на CREATE TABLE
3. Нет синтаксических ошибок в SQL

### Schema не синхронизирована

Если schema в коде и БД рассинхронизировались:

\`\`\`bash
# 1. Создайте backup БД!
# 2. Сгенерируйте новую миграцию
npm run db:generate

# 3. Проверьте что миграция делает ожидаемые изменения
# 4. Примените миграцию
npm run db:migrate
\`\`\`

### Конфликты миграций

Если несколько разработчиков создали миграции одновременно:

1. Убедитесь что все миграции закоммичены
2. Примените их в правильном порядке (по timestamp)
3. При конфликтах - создайте новую миграцию для разрешения

## Monitoring

Следите за:
- Временем выполнения миграций (особенно на больших таблицах)
- Блокировками таблиц во время миграций
- Размером БД после миграций

Логи миграций сохраняются в `migrations/meta/_journal.json`
