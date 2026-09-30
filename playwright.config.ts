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
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // El formulario de contacto no envía mails en e2e (ver lib/resend.ts).
    env: {
      CONTACT_DRY_RUN: "1",
      CONTACT_TO_EMAIL: "e2e@example.com",
      CONTACT_FROM_EMAIL: "Flexora <onboarding@resend.dev>",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
