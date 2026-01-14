# 🔒 Security Guidelines

Документ описывает текущее состояние безопасности приложения, известные риски и рекомендации по улучшению.

## Текущее состояние безопасности

### ✅ Реализовано

1. **Environment Variables**
   - API ключи вынесены в `.env` файл
   - `.env` добавлен в `.gitignore`
   - Валидация обязательных переменных при старте сервера

2. **Error Handling**
   - Централизованная обработка ошибок на клиенте и сервере
   - Error Boundary для React
   - Structured error logging

3. **Input Validation**
   - Zod schemas для валидации данных
   - React Hook Form с валидацией форм

4. **Authentication**
   - Token-based аутентификация через Directus
   - Автоматический refresh токенов
   - Защищённые роуты

## ⚠️ Известные риски безопасности

### 1. Хранение токенов в localStorage (СРЕДНИЙ РИСК)

**Проблема:**
Токены аутентификации (access и refresh) хранятся в `localStorage`, что делает их уязвимыми для XSS атак.

**Текущая реализация:**
\`\`\`typescript
// client/src/lib/directus.ts:26, 86
localStorage.setItem('directus_token', access_token);
localStorage.setItem('directus_refresh_token', refresh_token);
\`\`\`

**Риски:**
- Любой JavaScript код на странице может прочитать токены
- XSS атаки могут украсть токены
- Токены не защищены дополнительным шифрованием

**Рекомендации:**

#### Краткосрочные (можно внедрить сейчас):

1. **Content Security Policy (CSP)** - добавить в HTML header:
\`\`\`html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
\`\`\`

2. **Короткие сроки жизни токенов** - настроить в Directus:
   - Access token: 15 минут
   - Refresh token: 7 дней

3. **XSS Protection headers** на сервере:
\`\`\`typescript
// server/index.ts
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
\`\`\`

4. **Sanitize user input** - используйте DOMPurify для пользовательского контента

#### Долгосрочные (требуют архитектурных изменений):

1. **Backend proxy для токенов** - хранить токены в httpOnly cookies:
\`\`\`typescript
// server/routes.ts
app.post('/auth/login', async (req, res) => {
  const directusResponse = await fetch('https://directus.nplanner.ru/auth/login', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });

  const { access_token, refresh_token } = await directusResponse.json();

  // Set httpOnly cookies
  res.cookie('access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ success: true });
});
\`\`\`

2. **Session management** - использовать express-session с secure storage

### 2. API Endpoints без rate limiting (НИЗКИЙ РИСК)

**Проблема:**
API endpoints не защищены от brute-force атак.

**Рекомендации:**

Установить `express-rate-limit`:
\`\`\`bash
npm install express-rate-limit
\`\`\`

\`\`\`typescript
// server/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
\`\`\`

### 3. Отсутствие CORS конфигурации (СРЕДНИЙ РИСК)

**Проблема:**
CORS не настроен, что может привести к CSRF атакам.

**Рекомендации:**

\`\`\`bash
npm install cors
\`\`\`

\`\`\`typescript
// server/index.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
\`\`\`

### 4. SQL Injection через некорректную фильтрацию (НИЗКИЙ РИСК)

**Проблема:**
Drizzle ORM защищает от SQL injection, но нужно быть осторожным с динамическими запросами.

**Рекомендации:**
- Всегда используйте параметризованные запросы Drizzle
- Не конструируйте SQL запросы через строки
- Валидируйте все входные данные через Zod schemas

## 🛡️ Checklist безопасности для Production

### Обязательно перед деплоем:

- [ ] Все API ключи в environment variables
- [ ] `.env` файл в `.gitignore` и не закоммичен
- [ ] CSP headers настроены
- [ ] XSS protection headers добавлены
- [ ] HTTPS включен (SSL/TLS сертификат)
- [ ] CORS правильно настроен
- [ ] Rate limiting настроен
- [ ] Session secrets используют crypto.randomBytes()
- [ ] Database credentials безопасные (сложные пароли)
- [ ] Error messages не раскрывают внутреннюю структуру

### Дополнительно (рекомендуется):

- [ ] Регулярные security audits: `npm audit`
- [ ] Dependency updates автоматизированы
- [ ] Логирование безопасности настроено
- [ ] Мониторинг подозрительной активности
- [ ] Backup базы данных настроен
- [ ] Incident response plan создан

## 🔍 Security Audit

Регулярно запускайте проверку зависимостей:

\`\`\`bash
# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix

# Исправление с breaking changes (осторожно!)
npm audit fix --force
\`\`\`

## 📊 Monitoring и Logging

### Что логировать:

1. **Authentication events:**
   - Успешные входы
   - Неудачные попытки входа
   - Logout события
   - Token refresh events

2. **API errors:**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Rate limit hits

3. **Security events:**
   - Подозрительные запросы
   - Multiple failed login attempts
   - Access to unauthorized resources

### Рекомендуемые сервисы:

- **Sentry** - Error tracking и monitoring
- **LogRocket** - Session replay и logging
- **Datadog** - Infrastructure monitoring

## 🚨 Incident Response

### Если произошла утечка токенов:

1. **Немедленно:**
   - Отозвать все активные токены в Directus
   - Форсировать logout всех пользователей
   - Изменить SESSION_SECRET

2. **В течение часа:**
   - Проанализировать логи на подозрительную активность
   - Уведомить пользователей о необходимости сменить пароль

3. **В течение дня:**
   - Провести полный security audit
   - Внедрить дополнительные меры защиты
   - Документировать инцидент

### Если произошла утечка API ключей:

1. **Немедленно:**
   - Отозвать скомпрометированные ключи
   - Сгенерировать новые ключи
   - Обновить `.env` на всех серверах

2. **В течение часа:**
   - Проверить нет ли несанкционированного использования API
   - Проанализировать как произошла утечка

## 📚 Дополнительные ресурсы

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 📝 Security Updates Log

Ведите лог всех security-related изменений:

| Дата | Изменение | Автор | Тип |
|------|-----------|-------|-----|
| 2026-01-14 | Moved API keys to environment variables | Assistant | Security Fix |
| 2026-01-14 | Added centralized error handling | Assistant | Enhancement |
| 2026-01-14 | Created security documentation | Assistant | Documentation |

---

**Помните:** Безопасность - это процесс, а не конечное состояние. Регулярно обновляйте зависимости, проводите audits, и следите за новыми уязвимостями.
