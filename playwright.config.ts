import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  // El fondo WebGL se renderiza por software; con más de 2 workers la CPU se satura y los tests caen por timeout.
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000/es",
    // Nunca se reutiliza un servidor ya levantado: uno de `npm run dev`/`start` con la key real de Resend en
    // .env.local no tendría dry run y e2e/contact.spec.ts mandaría decenas de mails reales por corrida. Con el
    // puerto 3000 ocupado Playwright falla con un error claro, que es lo seguro.
    reuseExistingServer: false,
    timeout: 180_000,
    // El formulario de contacto no envía mails en e2e (ver lib/resend.ts). El dry run va explícito y la key de
    // Resend se pisa con "" (una variable ya definida no la pisa .env.local): si el dry run fallara, no hay
    // credenciales reales con las que enviar.
    env: {
      CONTACT_DRY_RUN: "1",
      RESEND_API_KEY: "",
      CONTACT_TO_EMAIL: "e2e@example.com",
      CONTACT_FROM_EMAIL: "Flexora <onboarding@resend.dev>",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
