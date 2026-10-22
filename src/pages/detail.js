import { h, safeUrl, externalLink, loading, errorState } from '../dom.js';
import { api, ingredientsOf, categoryName } from '../api.js';

export function detail(id) {
  const root = h('div', { class: 'page' }, loading('Cargando receta…'));

  api.byId(id).then((meal) => {
    if (!meal) {
      return root.replaceChildren(h('div', { class: 'state' }, h('strong', {}, 'Esa receta no existe.'), h('a', { href: '#/recetas' }, 'Volver a recetas')));
    }
    document.title = `${meal.strMeal} · Sazón`;
    const img = safeUrl(meal.strMealThumb);
    const video = safeUrl(meal.strYoutube);
    const source = safeUrl(meal.strSource, null);
    const steps = meal.strInstructions.split(/\r?\n+/).map((s) => s.replace(/^(step\s*)?\d+[.):]?\s*/i, '').trim()).filter((s) => s.length > 2);

    root.replaceChildren(
      h('a', { class: 'back', href: '#/recetas' }, '← Volver a recetas'),
      h('article', { class: 'recipe' },
        h('div', { class: 'recipe__media' },
          img && h('img', { src: img, alt: meal.strMeal, width: 600, height: 600 }),
          h('div', { class: 'recipe__links' },
            video && externalLink(video, '▶ Ver video en YouTube', 'btn'),
            source && externalLink(source, 'Fuente original', 'btn btn--ghost'))),
        h('div', { class: 'recipe__info' },
          h('h1', {}, meal.strMeal),
          h('div', { class: 'tags' },
            h('span', { class: 'tag' }, categoryName(meal.strCategory)),
            h('span', { class: 'tag' }, `Cocina ${meal.strArea}`),
            ...(meal.strTags ?? '').split(',').filter(Boolean).slice(0, 3).map((t) => h('span', { class: 'tag tag--soft' }, t.trim()))),
          h('h2', {}, 'Ingredientes'),
          h('ul', { class: 'ingredients' }, ingredientsOf(meal).map((i) =>
            h('li', {}, h('span', {}, i.name), h('span', { class: 'muted' }, i.measure)))))),
      h('section', { class: 'section steps' },
        h('h2', {}, 'Preparación'),
        h('ol', {}, steps.map((s) => h('li', {}, s)))));
  }).catch((err) => root.replaceChildren(errorState(err)));

  return root;
}
