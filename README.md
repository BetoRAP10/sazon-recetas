# Sazón · Recetas del mundo

Página web de recetas hecha con **Vite + JavaScript**. Consume en tiempo real el web service REST de [TheMealDB](https://www.themealdb.com/api.php) e incluye registro de usuarios con validación y medidas de seguridad (Unidad 3: seguridad, web services y APIs).

## Pantallas

| Ruta | Pantalla | Qué hace |
| --- | --- | --- |
| `#/` | Inicio | Receta del día (aleatoria), categorías y presentación del sitio |
| `#/recetas` | Recetas | Búsqueda por nombre y filtro por categoría |
| `#/receta/:id` | Detalle | Ingredientes con medidas, pasos de preparación y video de YouTube |
| `#/registro` | Registro | Formulario con validación de cada campo y medidor de contraseña |
| `#/login` | Iniciar sesión | Acceso con límite de intentos fallidos |

## API externa

[TheMealDB](https://www.themealdb.com/api.php) es una API gratuita de recetas. Endpoints usados:

| Endpoint | Uso |
| --- | --- |
| `random.php` | Receta del día |
| `categories.php` | Lista de categorías |
| `search.php?s=` | Búsqueda por nombre |
| `filter.php?c=` | Recetas de una categoría |
| `lookup.php?i=` | Detalle de una receta |

La clave de la API se lee de la variable de entorno `VITE_MEALDB_API_KEY` en el archivo `.env`, que está en `.gitignore` y **no se sube a GitHub**.

## Seguridad

- **Clave de la API en `.env`**, fuera del repositorio. Se incluye `.env.example` como plantilla.
- **Validación de campos** en el registro: nombre (solo letras, 3–50), correo, teléfono de 10 dígitos, edad mínima de 13 años, contraseña robusta (8+ caracteres, mayúscula, minúscula, número, símbolo, sin espacios y sin contener el correo), confirmación y aceptación de términos.
- **Contraseñas con hash PBKDF2-SHA-256** (210 000 iteraciones y sal aleatoria) mediante Web Crypto; nunca se guardan en texto plano. La verificación compara en tiempo constante.
- **Límite de intentos**: después de 5 inicios de sesión fallidos el acceso se bloquea 60 segundos. El mensaje de error no revela si el correo existe.
- **Protección contra XSS**: todo el contenido (de la API o del usuario) se inserta como texto con `textContent`, nunca con `innerHTML`. Las URLs de imágenes y videos se validan contra una lista de dominios `https` permitidos.
- **Content Security Policy** en el build de producción: solo scripts y estilos propios, e imágenes y peticiones a `www.themealdb.com`.
- **Enlaces externos** con `rel="noopener noreferrer"` y peticiones a la API con tiempo límite de 10 s.

> Nota: los usuarios se guardan en `localStorage` porque el proyecto no tiene backend; es una demostración. En producción el registro, el hash y la sesión se manejan en un servidor con base de datos. Además, las variables `VITE_*` se incluyen en el JavaScript del navegador; una clave realmente privada debe usarse solo desde un servidor.

## Cómo ejecutarlo

```bash
git clone https://github.com/BetoRAP10/sazon-recetas.git
cd sazon-recetas
npm install
cp .env.example .env    # y escribe tu clave (la gratuita de TheMealDB es 1)
npm run dev             # http://localhost:5173
```

Build de producción: `npm run build` y `npm run preview`.

## Estructura

```
src/
├── main.js          # Router por hash, barra de navegación y pie
├── api.js           # Cliente del web service de TheMealDB
├── security.js      # Hash de contraseñas, sesión y límite de intentos
├── validation.js    # Reglas de validación del registro
├── dom.js           # Creación segura de elementos y validación de URLs
├── components.js    # Tarjetas de receta y categorías
├── style.css
└── pages/           # home, recipes, detail, register, login
```
