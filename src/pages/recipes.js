import { h, loading, errorState } from '../dom.js';
import { api, categoryName } from '../api.js';
import { recipeCard, categoryChip } from '../components.js';
import { clean } from '../validation.js';

const SEARCH_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{0,40}$/;

export function recipes(params) {
  const query = clean(params.get('q') ?? '');
  const category = params.get('c') ?? '';
  const safeQuery = SEARCH_RE.test(query) ? query : '';

  const input = h('input', {
    type: 'search', name: 'q', value: safeQuery, maxlength: 40, placeholder: 'Ej. chicken, pasta, cake…',
    'aria-label': 'Buscar receta por nombre', autocomplete: 'off',
  });
  const hint = h('p', { class: 'field__error', role: 'alert' });
  const form = h('form', { class: 'search', novalidate: true, onSubmit: (e) => {
    e.preventDefault();
    const value = clean(input.value);
    if (!value) { hint.textContent = 'Escribe el nombre de una receta.'; return; }
    if (!SEARCH_RE.test(value)) { hint.textContent = 'Usa solo letras y espacios (máximo 40).'; return; }
    location.hash = `#/recetas?q=${encodeURIComponent(value)}`;
  } }, input, h('button', { class: 'btn', type: 'submit' }, 'Buscar'));

  const chips = h('div', { class: 'chips chips--small' });
  const results = h('div', { class: 'results' }, loading('Buscando recetas…'));
  const title = h('h2', { class: 'section__title' });

  api.categories().then((list) => chips.replaceChildren(...list.map((c) => categoryChip(c, c.strCategory === category))))
    .catch(() => chips.replaceChildren());

  let request;
  if (category) { title.textContent = `Categoría: ${categoryName(category)}`; request = api.byCategory(category); }
  else if (safeQuery) { title.textContent = `Resultados para “${safeQuery}”`; request = api.search(safeQuery); }
  else { title.textContent = 'Recetas populares'; request = api.search('chicken'); }

  request.then((meals) => {
    if (!meals.length) {
      return results.replaceChildren(h('div', { class: 'state' }, h('strong', {}, 'Sin resultados.'), 'Prueba con otro nombre, por ejemplo “beef” o “soup”.'));
    }
    results.replaceChildren(
      h('p', { class: 'muted' }, `${meals.length} receta${meals.length === 1 ? '' : 's'}`),
      h('div', { class: 'grid' }, meals.slice(0, 48).map(recipeCard)));
  }).catch((err) => results.replaceChildren(errorState(err)));

  return h('div', { class: 'page' },
    h('header', { class: 'page__head' },
      h('h1', {}, 'Recetas'),
      h('p', { class: 'muted' }, 'Busca por nombre (en inglés) o elige una categoría.'),
      form, hint),
    chips,
    h('section', { class: 'section' }, title, results));
}
