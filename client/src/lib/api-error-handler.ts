import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Централизованная обработка ошибок API
 */
export function handleApiError(error: unknown): ApiError {
  // Axios error
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Специфичные HTTP коды
    if (status === 401) {
      return {
        message: 'Сессия истекла. Пожалуйста, войдите снова.',
        status: 401,
        code: 'UNAUTHORIZED',
      };
    }

    if (status === 403) {
      return {
        message: 'У вас нет прав для выполнения этого действия',
        status: 403,
        code: 'FORBIDDEN',
      };
    }

    if (status === 404) {
      return {
        message: 'Запрошенный ресурс не найден',
        status: 404,
        code: 'NOT_FOUND',
      };
    }

    if (status === 429) {
      return {
        message: 'Слишком много запросов. Пожалуйста, подождите.',
        status: 429,
        code: 'RATE_LIMIT',
      };
    }

    if (status && status >= 500) {
      return {
        message: 'Ошибка сервера. Попробуйте позже.',
        status,
        code: 'SERVER_ERROR',
        details: data,
      };
    }

    // Ошибка сети
    if (error.code === 'ERR_NETWORK') {
      return {
        message: 'Ошибка сети. Проверьте подключение к интернету.',
        code: 'NETWORK_ERROR',
      };
    }

    // Таймаут
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Превышено время ожидания запроса',
        code: 'TIMEOUT',
      };
    }

    // Общая ошибка с сообщением от сервера
    return {
      message: data?.message || data?.error || error.message || 'Произошла ошибка',
      status,
      details: data,
    };
  }

  // Обычная ошибка JavaScript
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Неизвестный тип ошибки
  return {
    message: 'Произошла неизвестная ошибка',
    details: error,
  };
}

/**
 * Получить пользовательское сообщение об ошибке
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const apiError = handleApiError(error);
  return apiError.message;
}

/**
 * Логирование ошибок (можно расширить для отправки в сервис мониторинга)
 */
export function logError(error: unknown, context?: string) {
  const apiError = handleApiError(error);

  console.error(`[${context || 'API Error'}]`, {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details,
    timestamp: new Date().toISOString(),
  });

  // TODO: Отправить в сервис мониторинга (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoring(apiError);
  // }
}
