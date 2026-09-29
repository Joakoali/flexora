"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { LIMITS, PROJECT_TYPES, type ContactField, type ContactState } from "@/lib/contact";
import { contactAction } from "@/app/[lang]/actions/contact";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";

type Props = { t: Dictionary["closing"]["form"]; locale: Locale; whatsappHref: string };

const INITIAL_STATE: ContactState = { status: "idle" };
const FIELD_ORDER: ContactField[] = ["name", "email", "message"];

export function ContactForm(props: Props) {
  // Cambiar la key remonta el cuerpo: estado de la acción en idle y startedAt nuevo.
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="contact-form">
      <ContactFormBody key={formKey} {...props} onSendAnother={() => setFormKey((k) => k + 1)} />
    </div>
  );
}

function ContactFormBody({ t, locale, whatsappHref, onSendAnother }: Props & { onSendAnother: () => void }) {
  const [state, formAction, isPending] = useActionState(contactAction, INITIAL_STATE);
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);

  // Se setea en el cliente: la página se prerenderiza en el build, un valor del servidor sería viejo.
  useEffect(() => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      successTitleRef.current?.focus();
    } else if (state.status === "error") {
      const first = FIELD_ORDER.find((field) => state.errors[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  const errors = state.status === "error" ? state.errors : {};
  // React 19 resetea el form después de cada envío: los valores vuelven vía defaultValue.
  const values = state.status === "error" ? state.values : undefined;

  const fieldA11y = (field: ContactField) =>
    errors[field] ? { "aria-invalid": true as const, "aria-describedby": `${id}-${field}-error` } : {};
  const fieldError = (field: ContactField) => {
    const code = errors[field];
    return code ? (
      <p id={`${id}-${field}-error`} className="contact-form__error">
        {t.errors[code]}
      </p>
    ) : null;
  };

  return (
    <>
      {state.status !== "success" && (
        <form ref={formRef} action={formAction} aria-label={t.formLabel} className="contact-form__form">
          <input type="hidden" name="lang" value={locale} />
          <input ref={startedAtRef} type="hidden" name="startedAt" />
          <div className="contact-form__hp" aria-hidden="true">
            <label htmlFor={`${id}-website`}>Leave empty</label>
            <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <div className="contact-form__field">
            <label htmlFor={`${id}-name`} className="contact-form__label">
              {t.nameLabel}
            </label>
            <input
              id={`${id}-name`}
              name="name"
              type="text"
              required
              maxLength={LIMITS.name}
              autoComplete="name"
              defaultValue={values?.name}
              className="contact-form__input"
              {...fieldA11y("name")}
            />
            {fieldError("name")}
          </div>

          <div className="contact-form__field">
            <label htmlFor={`${id}-email`} className="contact-form__label">
              {t.emailLabel}
            </label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              required
              maxLength={LIMITS.email}
              autoComplete="email"
              defaultValue={values?.email}
              className="contact-form__input"
              {...fieldA11y("email")}
            />
            {fieldError("email")}
          </div>

          <fieldset className="contact-form__group">
            <legend className="contact-form__label">
              {t.projectLegend} <span className="contact-form__optional">{t.optional}</span>
            </legend>
            <div className="contact-form__chips">
              {PROJECT_TYPES.map((type) => (
                <label key={type} className="contact-form__chip">
                  <input
                    type="checkbox"
                    name="projectType"
                    value={type}
                    defaultChecked={values?.projectTypes.includes(type)}
                    className="contact-form__chip-input"
                  />
                  <span className="contact-form__chip-label">{t.projectTypes[type]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="contact-form__field">
            <label htmlFor={`${id}-message`} className="contact-form__label">
              {t.messageLabel} <span className="contact-form__optional">{t.optional}</span>
            </label>
            <textarea
              id={`${id}-message`}
              name="message"
              rows={4}
              maxLength={LIMITS.message}
              placeholder={t.messagePlaceholder}
              defaultValue={values?.message}
              className="contact-form__input contact-form__textarea"
              {...fieldA11y("message")}
            />
            {fieldError("message")}
          </div>

          <p className="contact-form__form-error" aria-live="polite">
            {errors.form === "send_failed" && (
              <>
                {t.errors.send_failed}{" "}
                <TextLink href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  {t.errors.sendFailedLink}
                </TextLink>
              </>
            )}
          </p>

          <div className="contact-form__submit">
            <Button type="submit" disabled={isPending} aria-disabled={isPending || undefined}>
              {isPending ? t.sending : t.submit}
            </Button>
          </div>
        </form>
      )}

      <div aria-live="polite" className="contact-form__live">
        {state.status === "success" && (
          <div className="contact-form__success">
            <h3 ref={successTitleRef} tabIndex={-1} className="h3 contact-form__success-title">
              {t.successTitle}
            </h3>
            <p className="contact-form__success-body">{t.successBody}</p>
            <Button variant="secondary" onClick={onSendAnother}>
              {t.sendAnother}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
