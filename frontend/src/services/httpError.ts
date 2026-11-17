import axios from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === 'string')
    ) {
      return message.join(' ');
    }

    if (!error.response) {
      return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
    }
  }

  return 'No se pudo completar la acción. Inténtalo de nuevo.';
}
