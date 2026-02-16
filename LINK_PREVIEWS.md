# Guía técnica: Cómo funcionan las previews de enlaces y cómo reutilizarlas

Esta guía explica en detalle cómo funcionan las previews (vistas previas) de enlaces en una web, los metadatos implicados, las estrategias de implementación (server-side y client-side), medidas de seguridad, caching, optimización de imágenes y ejemplos de implementación reutilizables.

## Resumen

- Una "preview" de enlace (link preview) es la vista resumida que muestran mensajería, redes sociales y navegadores cuando se comparte una URL: título, descripción, imagen y URL canonical.
- Las previews se construyen principalmente a partir de metadatos HTML en la sección `<head>` (Open Graph, Twitter Cards, oEmbed) o mediante parsing del HTML completo cuando faltan metadatos.
- Para implementar previews reutilizables conviene ofrecer un endpoint server-side que haga fetch del recurso remoto, extraiga metadatos e imágenes, aplique validaciones y caching, y devuelva un JSON estandarizado para el cliente.

## Metadatos relevantes

- Open Graph (recomendado, ampliamente soportado):
  - `og:title` — título legible.
  - `og:description` — descripción breve.
  - `og:image` — URL absoluta de la imagen representativa.
  - `og:url` — URL canónica.
  - `og:type` — `website`, `article`, etc.
  - `og:site_name` — nombre del sitio.

- Twitter Cards (complementario):
  - `twitter:card` — `summary` o `summary_large_image`.
  - `twitter:title`, `twitter:description`, `twitter:image`.

- oEmbed / JSON-LD: algunos servicios exponen endpoints o JSON-LD (`<script type="application/ld+json">`) con metadatos estructurados que conviene priorizar.

- Fallbacks: si faltan meta tags, extraer `<title>`, `<meta name="description">`, primer `<img>` visible o `<link rel="image_src">`.

## Cómo los servicios generan previews (comportamiento típico)

- Un *unfurler* o *link preview service* realiza una petición HTTP al destino (a veces un HEAD, normalmente un GET) y analiza el HTML devuelto para encontrar los metadatos listados arriba.
- Orden de prioridad habitual: Open Graph > Twitter Cards > oEmbed/JSON-LD > meta description + title > primer recurso de imagen.
- Para imágenes muchos servicios verifican dimensiones mínimas (ej. 200x200) y formato (image/jpeg, image/png, image/webp), y descartan imágenes demasiado pequeñas o en formatos no soportados.

## Recomendaciones de diseño general

- Proveer un endpoint propio `/api/preview?url=...` que centralice fetch, parsing, caching y sanitización.
- No permitir fetchs directos desde el cliente hacia URLs arbitrarias (CORS + seguridad). El cliente pide al servidor y el servidor hace el fetch remoto.
- Normalizar la respuesta del endpoint a un JSON del tipo:

```json
{
  "url": "https://example.com/article/123",
  "title": "Título",
  "description": "Descripción corta",
  "image": "https://.../image.jpg",
  "site_name": "Example",
  "type": "article",
  "fetched_at": "2026-01-31T...Z"
}
```

## Implementación Server-side (pasos detallados)

1. Validar la URL de entrada
   - Permitir solo `http` y `https`.
   - Rechazar URLs con credenciales (`user:pass@host`).
   - Resolver host y rechazar IPs privadas/loopback/atar dentro de la RFC1918/127.0.0.1/169.254/::1 para evitar SSRF.

2. Realizar la petición HTTP
   - Usar timeout corto (ej. 2-5s), tamaño máximo de respuesta (ej. 2–5 MB) y límite de redirecciones (ej. 5).
   - Cabeceras: `User-Agent` legible, `Accept: text/html`.

3. Comprobar `Content-Type`
   - Si no es `text/html`, intentar manejar casos como JSON o RSS (si apropiado) y usar valores por defecto.

4. Parsear HTML (solo `head` preferentemente)
   - Extraer `og:*`, `twitter:*`, `link[rel=image_src]`, `title`, `meta[name=description]`, y JSON-LD.
   - Resolver URLs relativas con la `base` de la página.

5. Selección de imagen
   - Priorizar `og:image` y `twitter:image`.
   - Si faltan, buscar `<link rel="image_src">` y luego el primer `<img>` con dimensiones aceptables.
   - Verificar la imagen con una petición HEAD o descarga parcial para confirmar `Content-Type` y dimensiones (si posible).

6. Sanitización
   - Limpiar strings (truncate a límites razonables), eliminar scripts, y evitar inyección en respuesta.

7. Caching
   - Cachear por clave (`preview:{host}{path}` o hash de URL). TTL razonable (ej. 1h–24h) y usar revalidation (stale-while-revalidate).
   - Opcional: almacenar también hashes de imagen para detectar cambios.

8. Devolver JSON estandarizado

## Seguridad (detalles importantes)

- Protecciones SSRF:
  - Resolver hostname y bloquear rangos privados y loopback.
  - Limitar número de conexiones concurrentes por IP o token.
- Limitar recursos:
  - Timeouts, máximo bytes leídos, límite de redirecciones.
- Validar entradas:
  - Normalizar la URL y rechazar esquemas no permitidos.
- Sanitizar salida:
  - Nunca devolver HTML sin escape; el endpoint debe devolver JSON.
- Políticas de acceso:
  - Opcionalmente requerir API key para evitar abusos si el endpoint es público.

## Rendimiento y escalabilidad

- Cache distribuido (Redis) para respuestas JSON y metainformación de imágenes.
- Prefetch asíncrono: cuando un usuario pega un enlace, encolar el fetch y responder con datos en caché si existen; marcar la preview como "pendiente" mientras se resuelve.
- Image proxying: servir imágenes a través del dominio propio (`/img-proxy?src=...`) para optimizar y evitar hotlinking.
- Colas y workers para procesar peticiones largas y comprobación de dimensiones de imagen.

## Manejo de imágenes (prácticas)

- Generar thumbnails y versiones optimizadas (webp) usando un servicio de imagen o librería.
- Comprobar dimensiones: preferir imágenes >= 300x150 para `summary_large_image`.
- Si no hay imagen adecuada, devolver placeholder con dominio/coloquial del sitio.

## Client-side (qué hacer en el frontend)

- Evitar realizar fetchs directos al destino por CORS y seguridad.
- Llamar al endpoint interno `/api/preview?url=...` y renderizar el JSON devuelto.
- Interfaz: mostrar skeleton mientras se obtiene la preview; permitir reintento manual si falla.

## Ejemplo: endpoint Node.js (Express) — esquema básico

```js
// Esquema simplificado: validar URL, fetch, parse con cheerio, cachear.
import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const app = express();

app.get('/api/preview', async (req, res) => {
  const url = req.query.url;
  // 1) Validar URL (omitir validación completa aquí)
  if (!url) return res.status(400).json({ error: 'missing url' });

  // 2) Fetch con timeout y límites (omitir detalles aquí)
  const resp = await fetch(url, { timeout: 4000 });
  if (!resp.ok) return res.status(502).json({ error: 'bad upstream' });
  const html = await resp.text();

  // 3) Parsear
  const $ = cheerio.load(html);
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name=description]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

  return res.json({ url, title: ogTitle, description: ogDesc, image: ogImage });
});

app.listen(3000);
```

Nota: el ejemplo anterior es simplificado. En producción hay que añadir validación, límites, caché y protección SSRF.

## Ejemplo: flujo con caching (conceptual)

- Cliente pide `/api/preview?url=https://example.com/a`.
- Servidor busca en Redis por `preview:sha1(url)`.
  - Si existe y no está caducado, devuelve la cache.
  - Si existe y está stale, devuelve la cache pero en background refresca (stale-while-revalidate).
  - Si no existe, encola worker para fetch/parse y devuelve resultado cuando termine o un placeholder si es asíncrono.

## Consideraciones para redes sociales y bots

- Si controlas la página destino, lo ideal es proveer Open Graph y Twitter Cards correctos.
- Twitter/FB/Slack realizan fetchs propios; no dependen de tu endpoint. Tu endpoint sirve para previews dentro de tu propia app.
- Para debugging usar herramientas: Twitter Card Validator, Facebook Sharing Debugger, Slack's link unfurl logs.

## Checklist de implementación reutilizable

- [ ] Endpoint server-side con validación de URLs.
- [ ] Parsing de OG/Twitter/oEmbed y fallbacks.
- [ ] Selección y verificación de imagen con comprobación de dimensiones.
- [ ] Caching con TTL y stale-while-revalidate.
- [ ] Protecciones SSRF y límites de recursos.
- [ ] Image proxy y thumbnails.
- [ ] Logging y métricas (latencia, errores, códigos HTTP remotos rechazados).

## Recomendaciones finales

- Prioriza Open Graph en las páginas que controles; facilita el trabajo de los "unfurlers".
- Centraliza el fetch de previews en backend, aplica caching y sanitización.
- Implementa validaciones SSRF y límites rígidos en producción.
- Ofrece un JSON estandarizado y sencillo para que cualquier frontend lo consuma sin lógica adicional.

---

Si quieres, puedo:

- Añadir un ejemplo completo listo para ejecutar (Node.js + Dockerfile + package.json).
- Implementar la versión mínima funcional en este repo.

Indícame qué prefieres y lo pongo en marcha.
