const SECRET = process.env.SESSION_SECRET || 'cambia-este-secreto-en-produccion';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const firma = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toBase64Url(firma);
}

export async function crearSesion(userId: number, username: string): Promise<string> {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${username}.${exp}`;
  const firma = await sign(payload);
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload).buffer as ArrayBuffer);
  return `${payloadB64}.${firma}`;
}

export async function verificarSesion(token: string | undefined): Promise<{ userId: number; username: string } | null> {
  if (!token) return null;
  const [payloadB64, firma] = token.split('.');
  if (!payloadB64 || !firma) return null;

  let payload: string;
  try {
    payload = new TextDecoder().decode(fromBase64Url(payloadB64));
  } catch {
    return null;
  }

  const firmaEsperada = await sign(payload);
  if (firma !== firmaEsperada) return null;

  const [userIdStr, username, expStr] = payload.split('.');
  const exp = Number(expStr);
  if (Date.now() > exp) return null;

  return { userId: Number(userIdStr), username };
}

export const COOKIE_NAME = 'poa_session';
export const COOKIE_MAX_AGE = MAX_AGE_SECONDS;
