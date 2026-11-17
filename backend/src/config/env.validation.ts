export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const databaseUrl = config.DATABASE_URL;

  if (
    typeof databaseUrl !== 'string' ||
    !/^postgres(?:ql)?:\/\//i.test(databaseUrl)
  ) {
    throw new Error('DATABASE_URL debe ser una URL de PostgreSQL.');
  }

  const port = Number(config.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT debe ser un puerto entre 1 y 65535.');
  }

  const frontendUrl = config.FRONTEND_ORIGIN ?? config.FRONTEND_URL;

  if (typeof frontendUrl !== 'string') {
    throw new Error('FRONTEND_ORIGIN debe ser el origen del frontend.');
  }

  let frontendOrigin: string;

  try {
    frontendOrigin = new URL(frontendUrl).origin;
  } catch {
    throw new Error('FRONTEND_ORIGIN debe ser una URL válida.');
  }

  if (frontendOrigin !== frontendUrl || !/^https?:\/\//.test(frontendUrl)) {
    throw new Error('FRONTEND_ORIGIN debe ser un origen HTTP o HTTPS.');
  }

  const jwtSecret = config.JWT_SECRET;
  if (
    typeof jwtSecret !== 'string' ||
    Buffer.byteLength(jwtSecret, 'utf8') < 32 ||
    jwtSecret.startsWith('replace-with-')
  ) {
    throw new Error(
      'JWT_SECRET debe ser un secreto aleatorio de al menos 32 bytes.',
    );
  }

  const jwtExpiresIn = config.JWT_EXPIRES_IN;
  if (
    typeof jwtExpiresIn !== 'string' ||
    !/^[1-9]\d*(s|m|h|d)$/.test(jwtExpiresIn)
  ) {
    throw new Error(
      'JWT_EXPIRES_IN debe ser una duración positiva en s, m, h o d.',
    );
  }

  const demoUsername = config.DEMO_USERNAME;
  if (
    typeof demoUsername !== 'string' ||
    !/\S/.test(demoUsername) ||
    demoUsername.length > 100
  ) {
    throw new Error('DEMO_USERNAME debe tener entre 1 y 100 caracteres.');
  }

  const demoPassword = config.DEMO_PASSWORD;
  if (
    typeof demoPassword !== 'string' ||
    demoPassword.length < 8 ||
    demoPassword.length > 128
  ) {
    throw new Error('DEMO_PASSWORD debe tener entre 8 y 128 caracteres.');
  }

  return {
    ...config,
    FRONTEND_ORIGIN: frontendOrigin,
    PORT: port,
  };
}
