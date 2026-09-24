# Cartoon-Vintage — Chateá con tu personaje favorito

Proyecto Integrador · Módulo 3 · Henry (Full Stack)

Single Page Application en JavaScript vanilla que permite chatear con un personaje ficticio
usando **Google Gemini AI**, con routing propio por History API, diseño responsive mobile-first,
y una Vercel Serverless Function como proxy seguro (la API key nunca llega al navegador).

> Rol simulado: desarrollador/a frontend junior en **Cartoon-Vintage**, una agencia digital ficticia
> especializada en experiencias interactivas. Esta app es una prueba de concepto (POC).

---

## Personajes

| Personaje | Lugar | Personalidad |
|---|---|---|
| 🐻 **Oso Yogui** | Parque Jellystone | Astuto y optimista, se cree "más listo que el oso promedio" y siempre tiene un plan para conseguir la próxima cesta de picnic, esquivando al Guardabosques Smith. |
| 🐾 **Scooby-Doo** | La Máquina del Misterio | Gran danés cobarde y glotón de Mystery Inc.; con mucho miedo (y algún Scooby Snack de por medio) siempre termina ayudando a resolver el misterio. |
| 🥕 **Bugs Bunny** | Su madriguera | Conejo astuto, sarcástico y siempre un paso adelante de quien intente molestarlo. Saluda con su clásico "¿Qué hay de nuevo, viejo?". |

Cada uno tiene su propio *system prompt* (definido en [`src/characters.js`](src/characters.js)) que fija su
personalidad, tono, límites de conocimiento (no saben nada del mundo real ni de tecnología moderna) y la
instrucción de responder corto, en español, y de declinar en personaje cualquier pedido dañino.

> Oso Yogui, Scooby-Doo y Bugs Bunny pertenecen a sus respectivos titulares de derechos. Este proyecto es
> un ejercicio educativo y no comercial, realizado con fines de aprendizaje para un bootcamp.

---

## Funcionalidad

- **Routing SPA** con History API — `/home`, `/chat` (galería), `/chat/:personaje`, `/about`. Navegación
  sin recargar la página, soporte completo de los botones back/forward (`popstate`), y links interceptados
  vía `data-link`.
- **Chat**: diferenciación visual clara entre mensajes del usuario y del personaje, estado "escribiendo..."
  animado, manejo de errores de red/API, scroll automático al último mensaje.
- **Integración con Gemini** a través de una Vercel Serverless Function (`api/functions.js`, expuesta en
  `/api/functions`) que arma el `system_instruction` según el personaje y reenvía el **historial completo**
  de la conversación en cada request (Gemini no tiene memoria propia entre llamadas).
- **Responsive mobile-first**, con breakpoints en 480px, 768px y 1024px.
- **Extras implementados**:
  - Persistencia del historial en `localStorage`, separado por personaje, con botón "Borrar historial" e
    indicador visual de conversación guardada en cada tarjeta.
  - Galería de los 3 personajes, cada uno con su propia identidad visual.
  - Timestamps en cada mensaje.
  - Indicador animado de "escribiendo...".
  - Enter para enviar, Shift+Enter para salto de línea.
  - Botón para copiar al portapapeles las respuestas del personaje.
  - Modo oscuro/claro con toggle, persistido en `localStorage`.

---

## Diseño visual

La interfaz está pensada como una serie de **escenas** (no dashboards/cards genéricas): Home es un diorama
tipo parque con cielo en gradiente, sol, nubes y árboles animados en CSS puro; cada personaje tiene su
propia ambientación (Yogui = parque de día, Scooby = noche de misterio con luna, Bugs = paisaje urbano); y
el chat muestra un retrato del personaje con un header temático y burbujas de diálogo con cola, en vez de
un layout tipo ChatGPT genérico. Todas las animaciones (flotado suave de los personajes, deriva de nubes,
entrada con fade+scale) son `@keyframes` de CSS vanilla, sin librerías, y respetan
`prefers-reduced-motion`.

Las imágenes reales de los personajes (`assets/*.png`) provienen de clip-art de cada personaje; ninguna
tiene transparencia real (dos traen el patrón a cuadros típico de una vista previa de transparencia
"quemado" en los píxeles, y una tiene fondo blanco liso), algo que solo se pudo confirmar leyendo los
archivos directamente, no por CSS. En vez de intentar recortar ese fondo, cada imagen se enmarca como una
"figurita de colección" (tarjeta blanca con borde grueso), consistente con la estética general — así el
fondo del archivo se lee como una decisión de diseño en vez de un error. Si en algún momento se reemplazan
por PNGs con transparencia real, el marco blanco simplemente deja de notarse.

Si `assets/*.png` no existe, cada figura cae a un *blob* de CSS con el color del personaje (mismo lugar,
mismo tamaño) para que el layout nunca se rompa.

---

## Estructura del proyecto

```
├── api/
│   └── functions.js       # Serverless function (proxy seguro a Gemini) → /api/functions
├── assets/
│   ├── yogi.png             # Imágenes reales de cada personaje (ver "Diseño visual" abajo)
│   ├── scooby.png
│   └── bugs.png
├── src/
│   ├── index.html
│   ├── styles.css          # Sistema visual: escenas por personaje, animaciones CSS, dark mode
│   ├── app.js               # Router SPA (History API)
│   ├── chat.js               # Fetching + render del chat
│   ├── utils.js                # Transformación de datos, parseo y localStorage (testeado)
│   └── characters.js             # Datos y system prompts de los 3 personajes
├── tests/
│   ├── utils.test.js
│   ├── chat.test.js
│   └── routing.test.js
├── .env.example
├── vercel.json              # Rewrites para que el SPA funcione en refresh/deep link
├── vitest.config.js
└── package.json
```

---

## Requisitos y pasos para ejecutar local

### Requisitos

- [Node.js](https://nodejs.org/) 18 o superior.
- Una API key de **Google Gemini**, gratuita, obtenida en
  [Google AI Studio](https://aistudio.google.com/app/apikey).
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) para correr las serverless functions
  localmente con `vercel dev`.

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiá `.env.example` a `.env` y completá tu API key real (este archivo está en `.gitignore`, nunca se sube
al repositorio):

```bash
cp .env.example .env
```

```
GEMINI_API_KEY=tu_api_key_de_gemini
```

### 3. Ejecutar en local

```bash
vercel dev
```

Esto sirve tanto el frontend estático como la serverless function de `/api`, tal como se comporta en
producción. La primera vez, la CLI te va a pedir loguearte (device flow) y vincular el proyecto a tu
cuenta de Vercel.

> No agregamos `vercel dev` como script `"dev"` en `package.json`: la propia CLI de Vercel lo detecta como
> una invocación recursiva (`DEV_RECURSIVE_INVOCATION`) si el "Development Command" del proyecto coincide
> con el comando que ya está corriendo. Se ejecuta directo.

Abrí la URL que te indique la terminal (por defecto `http://localhost:3000`).

> Si solo querés navegar la interfaz sin probar la integración con Gemini, alcanza con levantar un
> servidor estático simple desde la raíz del proyecto (por ejemplo `npx serve .`) y abrir
> `/src/index.html` — el chat va a mostrar el estado de error esperado al no encontrar `/api/functions`.

---

## Cómo ejecutar los tests

```bash
npm test
```

Corre la suite completa con [Vitest](https://vitest.dev/) sobre entorno `jsdom` (16 tests en total):

- **`tests/utils.test.js`** — transformación de mensajes, parseo de la respuesta de Gemini, historial en
  `localStorage` aislado por personaje, y preferencia de tema.
- **`tests/chat.test.js`** — `fetchCharacterReply` contra `fetch` mockeado (éxito y error), verificando que
  llama a `/api/functions` con el payload correcto.
- **`tests/routing.test.js`** — router SPA: resolución de rutas (`/home`, `/chat`, `/about` y
  `/chat/:personaje`), `navigate()` vía `history.pushState`, reacción a `popstate` (back/forward del
  navegador) y redirección ante rutas desconocidas.

Para modo watch durante desarrollo: `npm run test:watch`.

---

## Cómo desplegar a Vercel

1. Subí el repositorio a GitHub (público).
2. En [vercel.com](https://vercel.com), **Add New → Project** e importá el repositorio.
3. En **Environment Variables**, agregá `GEMINI_API_KEY` con tu key real, para los entornos *Production*
   y *Preview*.
4. Desplegá. Vercel detecta automáticamente `api/functions.js` como Serverless Function (queda expuesta en
   `/api/functions`) y sirve el resto vía los `rewrites` de `vercel.json`.
5. Una vez desplegado, entrá a la URL pública y probá el flujo completo: navegar las 3 rutas, chatear con
   cada personaje, refrescar la página en `/chat/oso-yogui` (debe seguir funcionando gracias al rewrite),
   y verificar que no haya errores de la serverless function en el dashboard de Vercel (**Deployments →
   Functions**).

También podés desplegar desde la CLI una vez logueado (`vercel login`):

```bash
vercel        # deploy de preview
vercel --prod # deploy de producción
```

---

## Capturas de pantalla

*Pendiente: agregar acá capturas de la aplicación ya desplegada en producción (Home, galería, una
conversación completa con cada personaje, y la vista en mobile). Durante el desarrollo se verificó el flujo
completo funcionando contra la API real de Gemini vía `vercel dev` local — quedan pendientes las capturas
"oficiales" contra la URL pública ya desplegada.*

---

## Link a la aplicación desplegada

**https://comicsanscon-chat-spa.vercel.app**

Verificado en producción: las 4 rutas (incluyendo refresh directo en `/chat/:personaje` y `/about`), y una
conversación real con cada uno de los tres personajes contra la API de Gemini.

---

## Pendiente a cargo del usuario

1. Confirmar que la `GEMINI_API_KEY` cargada en Vercel (Production y Preview) es la definitiva — la
   usada fue la que el usuario compartió para testing; si se pegó en algún chat o lugar no seguro,
   conviene rotarla en Google AI Studio y actualizarla con `vercel env rm` / `vercel env add`.
2. Agregar las capturas de pantalla "oficiales" al README (Home, galería, chat de cada personaje, vista
   mobile) — no se generaron automáticamente porque el entorno no tiene forma de guardar capturas del
   navegador como archivos del repo.
3. Opcional: conectar el proyecto de Vercel al repositorio de GitHub (`vercel git connect`) para que cada
   push a `master` dispare un deploy automático. Ahora mismo el deploy se hizo manual por CLI (`vercel
   --prod`); conectarlo crea una integración/webhook persistente, así que se dejó pendiente de
   confirmación explícita en vez de hacerlo de forma automática.

Todo lo demás — código, estructura, tests, diseño, repo en GitHub y deploy en producción verificado
end-to-end contra Gemini real — está terminado.

---

## Participación de la IA

En una primera instancia, se utilizó Claude para validar la consigna y la documentación proporcionada por
Henry. Se le solicitó que analizara la presentación oficial del Proyecto Integrador (PDF) y la guía de
acompañamiento (DOCX), con el objetivo de contrastar ambos documentos y detectar posibles contradicciones
antes de comenzar la implementación.

Posteriormente, durante la etapa de planificación, Claude fue utilizado como asistente para analizar
alternativas de arquitectura y organización del proyecto. La IA propuso distintas posibilidades y el
usuario evaluó, modificó y decidió cuáles implementar. Entre otras cuestiones, se trabajó sobre el router
SPA, el contrato de la serverless function, la separación entre fetching, transformación y renderizado, los
breakpoints y la estrategia de testing.

Durante la implementación, la IA tuvo principalmente un rol de soporte técnico ante problemas concretos. En
determinados momentos, cuando el usuario no sabía cómo resolver un error, se encontraba desorientado
respecto de una implementación específica o aparecía un error de sintaxis, se recurrió a Claude para
analizar el problema, explicar su causa y proponer una posible solución. Estas sugerencias fueron luego
revisadas, implementadas y comprobadas por el usuario.

Un ejemplo concreto fue la integración con Gemini. Inicialmente se había implementado la conexión
utilizando `fetch` directamente contra la API REST, evitando incorporar dependencias innecesarias. Durante
las pruebas reales aparecieron problemas que no podían detectarse mediante mocks. Con la asistencia de
Claude se identificó que:

- el modelo `gemini-2.0-flash` utilizado inicialmente estaba deprecado y debía migrarse al modelo vigente
  indicado por la API;
- el modelo utilizado reservaba parte del límite de tokens para razonamiento interno, lo que provocaba que
  las respuestas del chatbot fueran excesivamente cortas;
- fue necesario configurar `thinkingConfig` para desactivar ese razonamiento en este caso de uso, ya que se
  trataba de un chat de personajes.

Estas correcciones fueron realizadas a partir de problemas encontrados durante las pruebas reales y no
simplemente copiando una implementación propuesta por la IA.

También se utilizó Claude como apoyo para interpretar y corregir errores producidos durante la ejecución
del proyecto, incluyendo problemas relacionados con Vercel, rutas, CSS y JavaScript. Por ejemplo, durante
las pruebas en dispositivos de diferentes tamaños se detectaron problemas de responsive design que fueron
analizados y corregidos. En mobile, el menú del header no se adaptaba correctamente porque faltaba
`flex-wrap`, y la cabecera de la vista de chat necesitó ajustes para evitar que los elementos se
comprimieran en pantallas pequeñas.

---

## Stack

Vanilla JavaScript (sin frameworks), CSS vanilla con variables (sin frameworks CSS), Vercel Serverless
Functions, Google Gemini API (REST), Vitest + jsdom.
