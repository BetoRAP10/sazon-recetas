import { h, safeUrl } from './dom.js';
import { categoryName } from './api.js';

export function recipeCard(meal) {
  const img = safeUrl(meal.strMealThumb);
  return h('a', { class: 'card', href: `#/receta/${encodeURIComponent(meal.idMeal)}` },
    img ? h('img', { src: `${img}/preview`, alt: meal.strMeal, loading: 'lazy', width: 300, height: 300 }) : h('div', { class: 'card__noimg' }),
    h('div', { class: 'card__body' },
      h('h3', {}, meal.strMeal),
      (meal.strCategory || meal.strArea) && h('p', { class: 'card__meta' },
        [meal.strCategory && categoryName(meal.strCategory), meal.strArea].filter(Boolean).join(' · '))));
}

export function categoryChip(cat, active) {
  const img = safeUrl(cat.strCategoryThumb);
  return h('a', {
    class: `chip${active ? ' chip--active' : ''}`,
    href: `#/recetas?c=${encodeURIComponent(cat.strCategory)}`,
    'aria-current': active ? 'true' : null,
  }, img && h('img', { src: img, alt: '', width: 40, height: 26 }), categoryName(cat.strCategory));
}
