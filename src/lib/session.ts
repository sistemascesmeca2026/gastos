import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'cambia-este-secreto-en-produccion';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function crearSesion(userId: number, username: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${username}.${exp}`;
  const firma = sign(payload);
  return `${Buffer.from(payload).toString('base64url')}.${firma}`;
}

export function verificarSesion(token: string | undefined): { userId: number; username: string } | null {
  if (!token) return null;
  const [payloadB64, firma] = token.split('.');
  if (!payloadB64 || !firma) return null;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const firmaEsperada = sign(payload);
  const a = Buffer.from(firma);
  const b = Buffer.from(firmaEsperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [userIdStr, username, expStr] = payload.split('.');
  const exp = Number(expStr);
  if (Date.now() > exp) return null;

  return { userId: Number(userIdStr), username };
}

export const COOKIE_NAME = 'poa_session';
export const COOKIE_MAX_AGE = MAX_AGE_SECONDS;
