import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ContactState } from "@/lib/contact";

const actionMock = vi.fn<(prev: ContactState, formData: FormData) => Promise<ContactState>>();
vi.mock("@/app/[lang]/actions/contact", () => ({
  contactAction: (prev: ContactState, formData: FormData) => actionMock(prev, formData),
}));

import { ContactForm } from "@/components/site/ContactForm";
import es from "@/app/[lang]/dictionaries/es.json";

const t = es.closing.form;
const WA = "https://wa.me/1?text=x";

function setup() {
  const utils = render(<ContactForm t={t} locale="es" whatsappHref={WA} />);
  const form = screen.getByRole("form", { name: t.formLabel });
  return { ...utils, form };
}

async function submit(form: HTMLElement) {
  await act(async () => {
    fireEvent.submit(form);
  });
}

afterEach(() => {
  actionMock.mockReset();
  vi.restoreAllMocks();
});

describe("ContactForm", () => {
  it("tiene labels visibles, fieldset con legend y 6 chips checkbox", () => {
    setup();
    expect(screen.getByLabelText(t.nameLabel)).toHaveProperty("required", true);
    expect(screen.getByLabelText(t.emailLabel)).toHaveProperty("type", "email");
    expect(screen.getByLabelText(new RegExp(t.messageLabel))).toHaveProperty("tagName", "TEXTAREA");
    const group = screen.getByRole("group", { name: new RegExp(t.projectLegend.replace("?", "\\?")) });
    expect(group.querySelectorAll('input[type="checkbox"][name="projectType"]')).toHaveLength(6);
    expect(screen.getByRole("checkbox", { name: t.projectTypes.webapp })).toHaveProperty("value", "webapp");
  });

  it("el honeypot queda fuera de la accesibilidad y del tab", () => {
    const { container } = setup();
    const hp = container.querySelector<HTMLInputElement>('input[name="website"]')!;
    expect(hp.tabIndex).toBe(-1);
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("completa startedAt al montar y manda lang", () => {
    const { container } = setup();
    expect(container.querySelector<HTMLInputElement>('input[name="startedAt"]')!.value).toMatch(/^\d+$/);
    expect(container.querySelector<HTMLInputElement>('input[name="lang"]')!.value).toBe("es");
  });

  it("con errores: marca aria-invalid, muestra el texto, enfoca el primero y conserva lo que vino del servidor", async () => {
    actionMock.mockResolvedValue({
      status: "error",
      errors: { email: "invalid" },
      values: { name: "Ana", email: "mal", projectTypes: ["webapp"], message: "hola" },
    });
    const { form } = setup();
    fireEvent.change(screen.getByLabelText(t.nameLabel), { target: { value: "  Ana  " } });
    await submit(form);

    const email = await screen.findByLabelText(t.emailLabel);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const errorId = email.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)!.textContent).toBe(t.errors.invalid);
    expect(document.activeElement).toBe(email);

    // "Ana" (sin espacios) prueba que el valor viene de state.values y no del DOM previo.
    expect((screen.getByLabelText(t.nameLabel) as HTMLInputElement).value).toBe("Ana");
    expect((email as HTMLInputElement).value).toBe("mal");
    expect((screen.getByRole("checkbox", { name: t.projectTypes.webapp }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(new RegExp(t.messageLabel)) as HTMLTextAreaElement).value).toBe("hola");
    expect(screen.getByLabelText(t.nameLabel).getAttribute("aria-invalid")).toBeNull();
  });

  it("send_failed: muestra el mensaje con link a WhatsApp", async () => {
    actionMock.mockResolvedValue({
      status: "error",
      errors: { form: "send_failed" },
      values: { name: "Ana", email: "ana@example.com", projectTypes: [], message: "" },
    });
    const { form } = setup();
    await submit(form);
    expect(await screen.findByText(t.errors.send_failed, { exact: false })).toBeTruthy();
    expect(screen.getByRole("link", { name: t.errors.sendFailedLink }).getAttribute("href")).toBe(WA);
  });

  describe("región aria-live del error de formulario", () => {
    // Un live region que aparece ya con contenido (o que sale de display:none) no se anuncia: tiene
    // que estar en el DOM y en el árbol de accesibilidad desde el inicio, vacía y sin huella visual.
    const liveRegion = (form: HTMLElement) => form.querySelector<HTMLElement>('[aria-live="polite"]');

    it("existe desde el inicio, vacía y sin ocultar", () => {
      const { form } = setup();
      const region = liveRegion(form)!;
      expect(region).not.toBeNull();
      expect(region.textContent).toBe("");
      expect(region.childElementCount).toBe(0);
      for (let el: HTMLElement | null = region; el && el !== document.body; el = el.parentElement) {
        expect(el.hidden, el.tagName).toBe(false);
        expect(el.getAttribute("aria-hidden"), el.tagName).toBeNull();
        expect(el.style.display, el.tagName).not.toBe("none");
        expect(el.style.visibility, el.tagName).not.toBe("hidden");
      }
    });

    it("send_failed: el mensaje entra en la misma región que ya estaba en el DOM", async () => {
      actionMock.mockResolvedValue({
        status: "error",
        errors: { form: "send_failed" },
        values: { name: "Ana", email: "ana@example.com", projectTypes: [], message: "" },
      });
      const { form } = setup();
      const before = liveRegion(form)!;
      await submit(form);
      await screen.findByText(t.errors.send_failed, { exact: false });

      const after = liveRegion(form)!;
      expect(after).toBe(before);
      expect(after.isConnected).toBe(true);
      expect(after.textContent).toContain(t.errors.send_failed);
      expect(within(after).getByRole("link", { name: t.errors.sendFailedLink })).toBeTruthy();
    });

    it("too_fast: también aparece dentro de la misma región", async () => {
      actionMock.mockResolvedValue({
        status: "error",
        errors: { form: "too_fast" },
        values: { name: "Ana", email: "ana@example.com", projectTypes: [], message: "" },
      });
      const { form } = setup();
      const before = liveRegion(form)!;
      await submit(form);
      await screen.findByText(t.errors.too_fast);
      expect(liveRegion(form)).toBe(before);
      expect(before.textContent).toBe(t.errors.too_fast);
    });

    it("sin error de formulario vuelve a quedar vacía (un error de campo no mete texto en ella)", async () => {
      actionMock.mockResolvedValue({
        status: "error",
        errors: { email: "invalid" },
        values: { name: "Ana", email: "mal", projectTypes: [], message: "" },
      });
      const { form } = setup();
      await submit(form);
      await screen.findByLabelText(t.emailLabel);
      expect(liveRegion(form)!.textContent).toBe("");
    });
  });

  it("too_fast: muestra el mensaje, conserva lo escrito y no ofrece el link a WhatsApp", async () => {
    actionMock.mockResolvedValue({
      status: "error",
      errors: { form: "too_fast" },
      values: { name: "Ana", email: "ana@example.com", projectTypes: [], message: "hola" },
    });
    const { form } = setup();
    await submit(form);
    expect(await screen.findByText(t.errors.too_fast)).toBeTruthy();
    expect(screen.queryByRole("link", { name: t.errors.sendFailedLink })).toBeNull();
    expect(screen.queryByText(t.errors.send_failed, { exact: false })).toBeNull();
    expect((screen.getByLabelText(t.nameLabel) as HTMLInputElement).value).toBe("Ana");
    expect((screen.getByLabelText(new RegExp(t.messageLabel)) as HTMLTextAreaElement).value).toBe("hola");
  });

  it("si la action se rechaza (red caída, 5xx, action vieja) no rompe la página: send_failed y conserva lo escrito", async () => {
    // Sin el wrapper, useActionState re-lanza el rechazo y, sin error boundary, React desmonta todo el árbol.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    actionMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { form } = setup();
    fireEvent.change(screen.getByLabelText(t.nameLabel), { target: { value: "  Ana   Pérez " } });
    fireEvent.change(screen.getByLabelText(t.emailLabel), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("checkbox", { name: t.projectTypes.webapp }));
    fireEvent.change(screen.getByLabelText(new RegExp(t.messageLabel)), { target: { value: "hola" } });
    await submit(form);

    expect(await screen.findByText(t.errors.send_failed, { exact: false })).toBeTruthy();
    expect(screen.getByRole("link", { name: t.errors.sendFailedLink }).getAttribute("href")).toBe(WA);
    expect((screen.getByLabelText(t.nameLabel) as HTMLInputElement).value).toBe("Ana Pérez");
    expect((screen.getByLabelText(t.emailLabel) as HTMLInputElement).value).toBe("ana@example.com");
    expect((screen.getByRole("checkbox", { name: t.projectTypes.webapp }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(new RegExp(t.messageLabel)) as HTMLTextAreaElement).value).toBe("hola");
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("[contact]"), expect.any(TypeError));
  });

  it("mientras envía: botón deshabilitado con texto de enviando", async () => {
    // La promesa se resuelve al final del test (no queda colgada): React 19
    // entrelaza todas las acciones async pendientes en una cola a nivel de
    // módulo (currentEntangledPendingCount en react-dom-client) que solo baja a
    // 0 cuando TODAS resuelven. Una promesa que nunca resuelve deja esa cola
    // trabada y rompe la acción del próximo test en este mismo archivo.
    let resolveAction!: (value: ContactState) => void;
    actionMock.mockReturnValue(new Promise<ContactState>((resolve) => (resolveAction = resolve)));
    const { form } = setup();
    await submit(form);
    const button = await screen.findByRole("button", { name: t.sending });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await act(async () => resolveAction({ status: "idle" }));
  });

  it("éxito: reemplaza el formulario, enfoca el título y 'Enviar otro' lo restaura vacío", async () => {
    actionMock.mockResolvedValue({ status: "success" });
    const { form, container } = setup();
    fireEvent.change(screen.getByLabelText(t.nameLabel), { target: { value: "Ana" } });
    await submit(form);

    const title = await screen.findByRole("heading", { name: t.successTitle });
    expect(document.activeElement).toBe(title);
    expect(screen.queryByRole("form", { name: t.formLabel })).toBeNull();
    expect(screen.getByText(t.successBody)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t.sendAnother }));
    });
    expect(screen.getByRole("form", { name: t.formLabel })).toBeTruthy();
    expect((screen.getByLabelText(t.nameLabel) as HTMLInputElement).value).toBe("");
    expect(container.querySelector<HTMLInputElement>('input[name="startedAt"]')!.value).toMatch(/^\d+$/);
  });
});
