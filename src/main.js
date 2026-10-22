import './style.css';
import { h } from './dom.js';
import { currentUser, logout } from './security.js';
import { home } from './pages/home.js';
import { recipes } from './pages/recipes.js';
import { detail } from './pages/detail.js';
import { register } from './pages/register.js';
import { loginPage } from './pages/login.js';

const routes = [
  { pattern: /^\/$/, nav: '/', view: () => home() },
  { pattern: /^\/recetas$/, nav: '/recetas', view: (_, params) => recipes(params) },
  { pattern: /^\/receta\/(\d{1,10})$/, nav: '/recetas', view: ([id]) => detail(id) },
  { pattern: /^\/registro$/, nav: '/registro', view: () => register() },
  { pattern: /^\/login$/, nav: '/login', view: () => loginPage() },
];

const main = h('main', { id: 'main', tabindex: '-1' });
const nav = h('nav', { class: 'nav', 'aria-label': 'Principal' });

function renderNav(active) {
  const user = currentUser();
  const link = (href, text) => h('a', { href: `#${href}`, class: active === href ? 'active' : null, 'aria-current': active === href ? 'page' : null }, text);
  nav.replaceChildren(
    link('/', 'Inicio'),
    link('/recetas', 'Recetas'),
    ...(user
      ? [h('span', { class: 'nav__user' }, `👤 ${user.name.split(' ')[0]}`),
         h('button', { class: 'btn btn--small btn--ghost', type: 'button', onClick: () => { logout(); location.hash = '#/'; } }, 'Cerrar sesión')]
      : [link('/login', 'Iniciar sesión'), h('a', { href: '#/registro', class: 'btn btn--small' }, 'Registrarse')]));
}

function router() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  const route = routes.find((r) => r.pattern.test(path));
  document.title = 'Sazón · Recetas del mundo';
  if (!route) {
    renderNav('');
    main.replaceChildren(h('div', { class: 'page state' }, h('strong', {}, 'Página no encontrada.'), h('a', { href: '#/' }, 'Ir al inicio')));
  } else {
    renderNav(route.nav);
    main.replaceChildren(route.view(path.match(route.pattern).slice(1), params));
  }
  window.scrollTo(0, 0);
}

document.querySelector('#app').replaceChildren(
  h('header', { class: 'topbar' },
    h('div', { class: 'topbar__inner' },
      h('a', { class: 'brand', href: '#/' }, h('img', { src: '/favicon.svg', alt: '', width: 32, height: 32 }), 'Sazón'),
      nav)),
  main,
  h('footer', { class: 'footer' },
    h('p', {}, 'Sazón · Proyecto de la Unidad 3 (seguridad, web services y APIs).'),
    h('p', {}, 'Datos de recetas: ', h('a', { href: 'https://www.themealdb.com', target: '_blank', rel: 'noopener noreferrer' }, 'TheMealDB API'))));

window.addEventListener('hashchange', router);
window.addEventListener('session-change', () => renderNav(routes.find((r) => r.pattern.test((location.hash.slice(1) || '/').split('?')[0]))?.nav));
router();
