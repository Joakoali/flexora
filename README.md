# flexora

Landing page of Flexora Design — estudio de desarrollo web, marketing digital y branding.

Sitio de una sola página en tres idiomas: español (`/es`), inglés (`/en`) y catalán (`/ca`, con la etiqueta CAT en el selector).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000 (redirige a /es, /en o /ca según Accept-Language)
npm run lint       # eslint
npm run test       # unit y componentes (Vitest)
npm run e2e        # end-to-end (Playwright): hace build y levanta la app solo
npm run build
npm run start
```

Copiá `.env.example` a `.env.local` y completá:

- `NEXT_PUBLIC_WHATSAPP_NUMBER` y `NEXT_PUBLIC_SITE_URL`: número de WhatsApp (solo dígitos, formato internacional) y URL pública.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`: formulario de contacto (solo servidor, nunca `NEXT_PUBLIC_`). Sin alguna de las tres el formulario falla cerrado: muestra el error de envío con un link a WhatsApp. Con `onboarding@resend.dev` como remitente, Resend solo entrega a la casilla dueña de la cuenta.
- `CONTACT_DRY_RUN=1` no envía nada: es solo para e2e y nunca va en producción (en producción de Vercel, `VERCEL_ENV=production`, se ignora y se loguea). Esa protección solo existe en Vercel: en cualquier otro host `VERCEL_ENV` no existe y `CONTACT_DRY_RUN=1` se respeta en producción (éxito falso y leads perdidos).

### Tests end-to-end

`npm run e2e` corre Playwright en dos proyectos (desktop y mobile). Su config hace `npm run build && npm run start` con `CONTACT_DRY_RUN=1`, así que el formulario no manda mails. La primera vez hay que instalar el navegador (`npx playwright install chromium`). Un solo spec: `npx playwright test e2e/contact.spec.ts`. Además pisa `RESEND_API_KEY` con vacío y nunca reutiliza un servidor ya levantado: esas variables solo valen para el servidor que levanta Playwright, así que con el puerto 3000 ocupado (por ejemplo un `npm run dev` corriendo) el e2e falla en vez de correr contra un servidor sin dry run, que mandaría mails de verdad desde `contact.spec.ts`. Para correr el e2e con el dev abierto, levantá el dev en otro puerto (`npm run dev -- -p 3001`).

## Documentación

- Spec de diseño: `docs/superpowers/specs/2026-09-07-flexora-home-design.md`
- Plan de implementación: `docs/superpowers/plans/2026-09-07-flexora-home.md`
- Formulario de contacto: `docs/superpowers/specs/2026-09-29-contact-form-design.md`
- Review de la PR #4 (decisiones técnicas y seguimientos): `docs/superpowers/specs/2026-11-08-pr4-review-fixes.md`
- Los textos viven en `app/[lang]/dictionaries/{es,en,ca}.json`.
