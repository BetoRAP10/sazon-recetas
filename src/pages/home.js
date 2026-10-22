import { h, safeUrl, loading, errorState } from '../dom.js';
import { api, categoryName } from '../api.js';
import { categoryChip } from '../components.js';
import { currentUser } from '../security.js';

export function home() {
  const user = currentUser();
  const daily = h('div', { class: 'daily' }, loading('Buscando la receta del día…'));
  const cats = h('div', { class: 'chips' }, loading('Cargando categorías…'));

  api.random().then((meal) => {
    if (!meal) return daily.replaceChildren(errorState(new Error('No hay receta disponible.')));
    const img = safeUrl(meal.strMealThumb);
    daily.replaceChildren(
      img && h('img', { class: 'daily__img', src: img, alt: meal.strMeal, width: 520, height: 520 }),
      h('div', { class: 'daily__body' },
        h('span', { class: 'eyebrow' }, 'Receta del día'),
        h('h2', {}, meal.strMeal),
        h('p', { class: 'muted' }, `${categoryName(meal.strCategory)} · Cocina ${meal.strArea}`),
        h('p', { class: 'daily__text' }, `${meal.strInstructions.slice(0, 220).trim()}…`),
        h('a', { class: 'btn', href: `#/receta/${encodeURIComponent(meal.idMeal)}` }, 'Ver receta completa')));
  }).catch((err) => daily.replaceChildren(errorState(err)));

  api.categories()
    .then((list) => cats.replaceChildren(...list.map((c) => categoryChip(c, false))))
    .catch((err) => cats.replaceChildren(errorState(err)));

  return h('div', { class: 'page' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero__text' },
        h('h1', {}, user ? `¡Hola, ${user.name.split(' ')[0]}! ¿Qué cocinamos hoy?` : 'Cocina recetas de todo el mundo'),
        h('p', {}, 'Cientos de recetas con ingredientes, pasos y video, obtenidas en tiempo real del web service de TheMealDB.'),
        h('div', { class: 'hero__actions' },
          h('a', { class: 'btn', href: '#/recetas' }, 'Explorar recetas'),
          !user && h('a', { class: 'btn btn--ghost', href: '#/registro' }, 'Crear cuenta gratis')))),
    h('section', { class: 'section' }, daily),
    h('section', { class: 'section' },
      h('h2', { class: 'section__title' }, 'Categorías'),
      cats),
    h('section', { class: 'section features' },
      feature('🔎', 'Busca por nombre', 'Encuentra cualquier platillo escribiendo su nombre.'),
      feature('🥘', 'Ingredientes exactos', 'Cada receta trae la lista de ingredientes y medidas.'),
      feature('🔒', 'Cuenta segura', 'Contraseñas cifradas con PBKDF2 y validación de cada campo.')));
}

const feature = (icon, title, text) =>
  h('div', { class: 'feature' }, h('span', { class: 'feature__icon', 'aria-hidden': 'true' }, icon), h('h3', {}, title), h('p', {}, text));
