// Cliente del web service REST de TheMealDB (https://www.themealdb.com/api.php).
// La clave se lee de la variable de entorno VITE_MEALDB_API_KEY definida en .env.
const API_KEY = import.meta.env.VITE_MEALDB_API_KEY;
const BASE_URL = 'https://www.themealdb.com/api/json/v1';
const TIMEOUT_MS = 10000;
const cache = new Map();

async function get(endpoint, params = {}) {
  if (!API_KEY) throw new Error('Falta la variable VITE_MEALDB_API_KEY en el archivo .env.');

  const url = new URL(`${BASE_URL}/${encodeURIComponent(API_KEY)}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (cache.has(url.href)) return cache.get(url.href);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`El servicio respondió con el código HTTP ${res.status}.`);
    const data = await res.json();
    if (endpoint !== 'random.php') cache.set(url.href, data);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('El servicio tardó demasiado en responder.');
    if (err instanceof TypeError) throw new Error('Sin conexión con el servicio de recetas.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  random: () => get('random.php').then((d) => d.meals?.[0] ?? null),
  categories: () => get('categories.php').then((d) => d.categories ?? []),
  search: (name) => get('search.php', { s: name }).then((d) => d.meals ?? []),
  byCategory: (category) => get('filter.php', { c: category }).then((d) => d.meals ?? []),
  byId: (id) => get('lookup.php', { i: id }).then((d) => d.meals?.[0] ?? null),
};

// Ingredientes y medidas vienen en campos strIngredient1..20 / strMeasure1..20.
export function ingredientsOf(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    if (name) list.push({ name, measure: meal[`strMeasure${i}`]?.trim() ?? '' });
  }
  return list;
}

export const CATEGORY_ES = {
  Beef: 'Res', Breakfast: 'Desayuno', Chicken: 'Pollo', Dessert: 'Postres', Goat: 'Cabra',
  Lamb: 'Cordero', Miscellaneous: 'Variado', Pasta: 'Pasta', Pork: 'Cerdo', Seafood: 'Mariscos',
  Side: 'Guarniciones', Starter: 'Entradas', Vegan: 'Vegano', Vegetarian: 'Vegetariano',
};
export const categoryName = (c) => CATEGORY_ES[c] ?? c;
