# Español peninsular (tú) en el diccionario

Fecha: 2026-11-21
Estado: aprobado en brainstorming, pendiente de plan de implementación
Rama: `feature/es-tu-peninsular`

## Contexto

El sitio se presenta como estudio de Barcelona y apunta al mercado español (el formulario asume números de
España, ver `2026-11-20-contact-reach-design.md`), pero `es.json` está escrito en voseo rioplatense
(«Contanos», «Escribinos», «necesitás»). Decisión del dueño: pasar todo el español a **tú peninsular**.

Es el ciclo 1 de dos. El ciclo 2 (reestructurar Servicios en cuatro disciplinas, con IA y apps a medida, y volver
a poner el chip de IA del hero, seguimiento xvi) se brainstormea aparte y ya escribe su copy en tú.

## Alcance

- Solo `app/[lang]/dictionaries/es.json`. `en.json` y `ca.json` no se tocan; no cambia ninguna clave, así que la
  paridad de `__tests__/i18n/dictionaries-parity.test.ts` sigue valiendo.
- Se cambian las formas verbales de voseo y «mail» por «email» (el campo ya se llama «Email» y es el término
  estándar en España).
- No cambian: «Hablemos» (idéntico en tú) y las primeras personas («Te respondemos…», «Enviaste…»).

## Reemplazos

| Clave | Hoy | Nuevo |
|---|---|---|
| `whatsappFab.label` | Escribinos por WhatsApp | Escríbenos por WhatsApp |
| `hero.primary` | Contanos tu proyecto | Cuéntanos tu proyecto |
| `process.steps[0].description` | …qué necesitás, a quién le hablás y qué tiene que pasar. | …qué necesitas, a quién le hablas y qué tiene que pasar. |
| `closing.description` | Contanos qué querés lograr. Te respondemos el mismo día. | Cuéntanos qué quieres lograr. Te respondemos el mismo día. |
| `closing.form.projectLegend` | ¿Qué necesitás? | ¿Qué necesitas? |
| `closing.form.messagePlaceholder` | Contanos un poco del proyecto | Cuéntanos un poco del proyecto |
| `closing.form.errors.invalid` | Ingresá un email válido. | Introduce un email válido. |
| `closing.form.errors.invalid_phone` | Revisá el número. Si no es de España, empezá con el prefijo del país (+54…). | Revisa el número. Si no es de España, empieza con el prefijo del país (+54…). |
| `closing.form.errors.need_one` | Dejanos un mail o un WhatsApp para poder responderte. | Déjanos un email o un WhatsApp para poder responderte. |
| `closing.form.errors.send_failed` | No pudimos enviarlo. Probá de nuevo o | No pudimos enviarlo. Prueba de nuevo o |
| `closing.form.errors.sendFailedLink` | escribinos por WhatsApp. | escríbenos por WhatsApp. |
| `closing.form.errors.too_fast` | Enviaste el formulario muy rápido. Probá de nuevo en un momento. | Enviaste el formulario muy rápido. Prueba de nuevo en un momento. |

`closing.email` (`info@flexoradesign.com`) y `closing.emailLabel` («o por mail a») no son voseo: `emailLabel` pasa a
«o por email a» por coherencia con el resto, y es el único cambio de léxico que no es una forma verbal.

## Test nuevo

`__tests__/i18n/es-register.test.ts`: recorre todos los strings de `es.json` y falla si alguno contiene una
forma de voseo de una lista explícita (comparando sin distinguir mayúsculas, con límites de palabra basados en
`\p{L}` porque `\b` de JS no entiende las tildes): `contanos`, `escribinos`, `dejanos`, `probá`, `ingresá`,
`revisá`, `empezá`, `necesitás`, `querés`, `tenés`, `podés`, `hablás`, `sabés`, `vos`, `sos`, `mirá`, `fijate`,
`acá`. El mensaje de error nombra la clave y la forma encontrada.

Se usa una lista y no una regla por terminación (`-ás`, `-és`) porque esa regla da falsos positivos con palabras
correctas («además», «después», «también»). La lista se amplía cuando aparezca una forma nueva.

## Verificación

1. El test nuevo falla antes de editar `es.json` (TDD) y pasa después.
2. `npm run test` completo, `npm run lint`.
3. `npx playwright test e2e/contact.spec.ts e2e/home.spec.ts`: los e2e leen los textos del diccionario, no hay
   literales en voseo (verificado con `git grep`: fuera de `es.json` solo «Hablemos», que no cambia, y strings de
   props en `__tests__/components/WhatsAppFab.test.tsx`, que son fixtures propios del test).
4. Con `npm run dev -- -p 3001` mirar `/es` a ojo: hero, cierre y un error de formulario.

## Fuera de alcance

- Léxico regional más allá de las formas verbales.
- Revisión del catalán (seguimiento ii) y de en.
- El copy de Servicios (ciclo 2).

## Entrega

Un commit de test (rojo) y uno de copy (verde), o uno solo si el agente lo prefiere; la implementación va a un
agente fresco con este spec.
