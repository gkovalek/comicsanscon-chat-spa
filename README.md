# ComicSansCon — Chateá con tu personaje favorito

Proyecto Integrador · Módulo 3 · Henry (Full Stack)

Single Page Application en JavaScript vanilla que permite chatear con un personaje ficticio
usando **Google Gemini AI**, con routing propio por History API, diseño responsive mobile-first,
y una Vercel Serverless Function como proxy seguro (la API key nunca llega al navegador).

> Rol simulado: desarrollador/a frontend junior en **ComicSansCon**, una agencia digital ficticia
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

## Estructura del proyecto

```
├── api/
│   └── functions.js       # Serverless function (proxy seguro a Gemini) → /api/functions
├── src/
│   ├── index.html
│   ├── styles.css          # Sistema visual: variables CSS, identidad por personaje, dark mode
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

## Uso de IA en el proyecto

Este proyecto se construyó con **Claude Code** (Anthropic) como asistente de desarrollo, dentro de un flujo
de trabajo guiado por el usuario. Registro del proceso:

- **Validación de la consigna**: se le pidió a Claude que leyera y contrastara la presentación oficial del
  PI (PDF) y la guía de acompañamiento (docx) provistas por Henry, para confirmar que no hubiera
  contradicciones antes de empezar a programar.
- **Plan de arquitectura**: se usó a Claude en "modo plan" para proponer la arquitectura completa (router
  SPA, contrato de la serverless function, separación fetching/transformación/render, breakpoints, plan de
  tests) antes de escribir código, iterando sobre esa propuesta con instrucciones explícitas del usuario
  (elección de personajes, qué extras implementar, endpoint exacto de la function, exigencia de tests de
  routing, y una dirección de diseño detallada para evitar una estética "genérica de IA").
- **Decisiones tomadas a partir de las respuestas de la IA**: se aceptó la propuesta de usar `fetch` directo
  contra la REST API de Gemini (en vez del SDK oficial) para no sumar dependencias; se aceptó la estructura
  de rutas `/chat` (galería) + `/chat/:personaje` como forma de cumplir literalmente las rutas pedidas por
  la consigna sin inventar una ruta extra; se pidieron explícitamente ajustes sobre la primera propuesta
  (endpoint sin extensión, extras completos, tests de routing dedicados, dirección visual editorial en vez
  de un layout genérico tipo SaaS) y se verificaron manualmente en el navegador antes de aceptarlos.
- **Verificación en navegador**: además de correr la suite de Vitest, se probó la aplicación en un
  navegador real (desktop y viewport mobile de 375px), lo que permitió detectar y corregir dos bugs reales
  de CSS introducidos durante el desarrollo (el nav del header no bajaba de línea en mobile por faltar
  `flex-wrap`, y el header de la vista de chat se apretaba en pantallas angostas) antes de dar el trabajo
  por terminado.
- **Verificación end-to-end contra Gemini real**: el usuario aportó una API key de prueba para validar la
  integración real (no solo mockeada). Eso permitió detectar y corregir dos problemas concretos en
  `api/functions.js` que ningún test mockeado podía haber revelado:
  1. El modelo `gemini-2.0-flash` está deprecado — la propia API devolvía 404 indicando migrar a
     `gemini-3.6-flash`.
  2. Gemini 3 reserva por defecto casi todo el `maxOutputTokens` para razonamiento interno ("thinking"),
     truncando las respuestas de chat a apenas unas palabras. Se agregó `thinkingConfig: { thinkingBudget: 0 }`
     porque un chat de personaje no necesita ese razonamiento profundo.
  También se corrió `vercel dev` real (no un sustituto) para replicar el comportamiento exacto de
  producción, lo que además destapó que declarar `"dev": "vercel dev"` en `package.json` dispara un error
  de invocación recursiva (`DEV_RECURSIVE_INVOCATION`) propio de la CLI de Vercel — se sacó ese script y
  se documentó correr `vercel dev` directo.
  Con esas correcciones, se probaron los tres personajes y una conversación multi-turno completa: Bugs
  Bunny recordó correctamente un nombre mencionado en un mensaje anterior, confirmando que el historial
  completo se reenvía en cada request tal como pide la consigna.
- Los *system prompts* de los tres personajes fueron escritos por la IA como borrador inicial y ya fueron
  validados con respuestas reales de Gemini durante el desarrollo; igualmente se recomienda una revisión
  manual adicional en Google AI Studio antes de un uso más extendido.

---

## Stack

Vanilla JavaScript (sin frameworks), CSS vanilla con variables (sin frameworks CSS), Vercel Serverless
Functions, Google Gemini API (REST), Vitest + jsdom.
