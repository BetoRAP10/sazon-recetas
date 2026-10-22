// Seguridad del lado del cliente: hash de contraseñas, sesión y límite de intentos.
// Es una demostración sin backend; en producción el hash y la verificación
// se hacen en el servidor y los usuarios viven en una base de datos.
const USERS_KEY = 'sazon.users';
const SESSION_KEY = 'sazon.session';
const ATTEMPTS_KEY = 'sazon.loginAttempts';
const PBKDF2_ITERATIONS = 210000;
export const MAX_ATTEMPTS = 5;
export const LOCK_SECONDS = 60;

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

// PBKDF2-SHA-256 con sal aleatoria: la contraseña nunca se guarda en texto plano.
async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
  return toB64(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), hash: await derive(password, salt), iterations: PBKDF2_ITERATIONS };
}

async function verifyPassword(password, record) {
  const hash = await derive(password, fromB64(record.salt));
  // Comparación en tiempo constante para no filtrar información por tiempos.
  let diff = hash.length ^ record.hash.length;
  for (let i = 0; i < Math.min(hash.length, record.hash.length); i++) diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}

function read(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}

const users = () => read(localStorage, USERS_KEY, []);
export const emailTaken = (email) => users().some((u) => u.email === email);

export async function registerUser({ name, email, phone, birthdate, password }) {
  if (emailTaken(email)) throw new Error('Ya existe una cuenta con ese correo.');
  const credentials = await hashPassword(password);
  const list = users();
  list.push({ name, email, phone, birthdate, credentials, createdAt: new Date().toISOString() });
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
  startSession({ name, email });
}

export function lockRemaining() {
  const { until = 0 } = read(localStorage, ATTEMPTS_KEY, {});
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export async function login(email, password) {
  if (lockRemaining() > 0) throw new Error(`Demasiados intentos. Espera ${lockRemaining()} s.`);
  const user = users().find((u) => u.email === email);
  const ok = user ? await verifyPassword(password, user.credentials) : false;
  if (!ok) {
    const state = read(localStorage, ATTEMPTS_KEY, { count: 0 });
    const count = (state.count ?? 0) + 1;
    const locked = count >= MAX_ATTEMPTS;
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(locked ? { count: 0, until: Date.now() + LOCK_SECONDS * 1000 } : { count }));
    // Mensaje genérico: no revela si el correo existe.
    throw new Error(locked
      ? `Demasiados intentos fallidos. La cuenta se bloqueó ${LOCK_SECONDS} segundos.`
      : `Correo o contraseña incorrectos. Intentos restantes: ${MAX_ATTEMPTS - count}.`);
  }
  localStorage.removeItem(ATTEMPTS_KEY);
  startSession({ name: user.name, email: user.email });
}

function startSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('session-change'));
}

export const currentUser = () => read(sessionStorage, SESSION_KEY, null);

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('session-change'));
}
