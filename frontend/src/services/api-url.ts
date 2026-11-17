export function getApiBaseUrl(value: string | undefined): string {
  const configuredBaseURL = value?.trim();

  if (!configuredBaseURL) {
    throw new Error('Falta configurar la variable VITE_API_URL.');
  }

  try {
    const parsedURL = new URL(configuredBaseURL);
    const apiPath = parsedURL.pathname.replace(/\/+$/, '');

    if (
      !['http:', 'https:'].includes(parsedURL.protocol) ||
      parsedURL.username ||
      parsedURL.password ||
      parsedURL.search ||
      parsedURL.hash ||
      apiPath !== '/api'
    ) {
      throw new Error();
    }

    return `${parsedURL.origin}/api`;
  } catch {
    throw new Error(
      'VITE_API_URL debe ser una URL HTTP(S) absoluta cuyo path sea /api.',
    );
  }
}
