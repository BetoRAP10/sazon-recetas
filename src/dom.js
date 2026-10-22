// Crea elementos del DOM sin usar innerHTML: todo el texto se inserta como
// nodos de texto, así los datos de la API o del usuario nunca se interpretan
// como HTML (protección contra XSS).
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

// Solo acepta URLs https de los dominios esperados; cualquier otra cosa
// (javascript:, data:, dominios desconocidos) se descarta. hosts = null acepta cualquier https.
const ALLOWED_HOSTS = ['www.themealdb.com', 'www.youtube.com', 'youtube.com'];

export function safeUrl(value, hosts = ALLOWED_HOSTS) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (!hosts || hosts.includes(url.hostname)) ? url.href : null;
  } catch {
    return null;
  }
}

// Enlaces externos: se abren en otra pestaña sin dar acceso a window.opener.
export const externalLink = (href, text, cls) =>
  h('a', { href, target: '_blank', rel: 'noopener noreferrer', class: cls }, text);

export function loading(text = 'Cargando…') {
  return h('div', { class: 'state', role: 'status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), text);
}

export function errorState(err) {
  return h('div', { class: 'state state--error', role: 'alert' },
    h('strong', {}, 'No se pudo cargar la información.'),
    h('span', {}, err?.message ?? 'Intenta de nuevo más tarde.'));
}
