"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CharCount,
  CountrySelect,
  OTHER_COUNTRY_CODE,
  PhoneCountrySelect,
} from "@/components/contact/ContactFieldControls";
import { useShop } from "@/contexts/ShopContext";
import { Link } from "@/i18n/navigation";
import { getWorldCountryByCode } from "@/lib/contact/world-countries";
import type { ShopConfigRfqFieldKey } from "@/lib/cms/shop-config/types";
import type { RfqPayload } from "@/lib/shop/types";

export type RfqFormState = Omit<
  RfqPayload,
  "items" | "estimatedTotal" | "countryCode" | "currency" | "officeId"
>;

const NOTES_MAX = 500;
const PHONE_MAX = 32;

const TEXT_FIELDS: Array<{
  key: ShopConfigRfqFieldKey;
  formKey: "company" | "contactName" | "email";
  labelKey: "company" | "contactName" | "email";
  inputType?: string;
  maxLength?: number;
}> = [
  { key: "company", formKey: "company", labelKey: "company", maxLength: 120 },
  { key: "contactName", formKey: "contactName", labelKey: "contactName", maxLength: 120 },
  { key: "email", formKey: "email", labelKey: "email", inputType: "email" },
];

const fieldClass = "h-10 w-full rounded-lg border border-border px-3 text-sm";

function composePhone(dial: string, local: string) {
  const national = local.trim().replace(/^0+/, "");
  if (!national) return "";
  return `${dial} ${national}`.slice(0, PHONE_MAX);
}

export function RfqDetailsForm({
  form,
  onChange,
}: {
  form: RfqFormState;
  onChange: (next: RfqFormState) => void;
}) {
  const t = useTranslations("shop");
  const tContact = useTranslations("contact");
  const { shopConfig } = useShop();
  const fields = shopConfig.rfq.fields;
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const dial = useMemo(
    () => getWorldCountryByCode(phoneCountryCode)?.dial ?? "+1",
    [phoneCountryCode]
  );
  const wasFilled = useRef(false);

  useEffect(() => {
    const filled = Boolean(
      form.company ||
        form.contactName ||
        form.email ||
        form.phone ||
        form.country ||
        form.message
    );
    if (wasFilled.current && !filled) {
      setPhoneLocal("");
      setPhoneCountryCode("US");
      setCountryCode("");
    }
    wasFilled.current = filled;
  }, [form]);

  const phoneConfig = fields.phone;
  const countryConfig = fields.country;
  const notesConfig = fields.message;

  return (
    <div className="space-y-3 border-t border-border/50 pt-4">
      {TEXT_FIELDS.map((field) => {
        const config = fields[field.key];
        if (!config.visible) return null;
        const id = `checkout-rfq-${field.formKey}`;
        return (
          <div key={field.key} className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-medium text-oboya-blue-dark">
              {t(field.labelKey)}
            </label>
            <input
              id={id}
              name={field.formKey}
              required={config.required}
              type={field.inputType ?? "text"}
              maxLength={field.maxLength}
              value={form[field.formKey]}
              onChange={(event) => onChange({ ...form, [field.formKey]: event.target.value })}
              className={fieldClass}
            />
          </div>
        );
      })}

      {phoneConfig.visible ? (
        <div className="space-y-1.5">
          <label htmlFor="checkout-rfq-phone" className="text-xs font-medium text-oboya-blue-dark">
            {t("phone")}
          </label>
          <div className="flex items-center gap-2">
            <PhoneCountrySelect
              id="checkout-rfq-phone-country"
              value={phoneCountryCode}
              onChange={(code) => {
                setPhoneCountryCode(code);
                const nextDial = getWorldCountryByCode(code)?.dial ?? "+1";
                onChange({ ...form, phone: composePhone(nextDial, phoneLocal) });
              }}
              label={tContact("phoneCountry")}
              searchPlaceholder={tContact("phoneCountrySearch")}
              emptyLabel={tContact("phoneCountryEmpty")}
              buttonClassName="h-10 rounded-lg border border-border bg-white px-2.5 text-sm"
            />
            <input
              id="checkout-rfq-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required={phoneConfig.required}
              maxLength={Math.max(1, PHONE_MAX - dial.length - 1)}
              value={phoneLocal}
              onChange={(event) => {
                const local = event.target.value;
                setPhoneLocal(local);
                onChange({ ...form, phone: composePhone(dial, local) });
              }}
              placeholder={tContact("phoneLocalPlaceholder")}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm"
            />
          </div>
        </div>
      ) : null}

      {countryConfig.visible ? (
        <div className="space-y-1.5">
          <label
            htmlFor="checkout-rfq-country"
            className="text-xs font-medium text-oboya-blue-dark"
          >
            {t("country")}
          </label>
          <CountrySelect
            id="checkout-rfq-country"
            value={countryCode}
            required={countryConfig.required}
            onChange={(code) => {
              setCountryCode(code);
              const name =
                code === OTHER_COUNTRY_CODE
                  ? tContact("countryOther")
                  : (getWorldCountryByCode(code)?.name ?? "");
              onChange({ ...form, country: name });
            }}
            label={tContact("country")}
            placeholder={tContact("countryPlaceholder")}
            otherLabel={tContact("countryOther")}
            searchPlaceholder={tContact("countrySearch")}
            emptyLabel={tContact("countryEmpty")}
            buttonClassName="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
          />
        </div>
      ) : null}

      {notesConfig.visible ? (
        <div className="space-y-1.5">
          <label htmlFor="checkout-rfq-message" className="text-xs font-medium text-oboya-blue-dark">
            {t("notes")}
          </label>
          <textarea
            id="checkout-rfq-message"
            name="message"
            rows={3}
            required={notesConfig.required}
            maxLength={NOTES_MAX}
            value={form.message}
            onChange={(event) =>
              onChange({ ...form, message: event.target.value.slice(0, NOTES_MAX) })
            }
            className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm"
          />
          <CharCount remaining={NOTES_MAX - form.message.length} />
        </div>
      ) : null}

      <div className="space-y-3 pt-1">
        <p className="text-xs leading-relaxed text-oboya-blue-dark/70">
          {t("privacyNotice")}{" "}
          <Link
            href="/privacy"
            className="text-oboya-blue-light underline-offset-2 hover:underline"
          >
            {t("privacyLink")}
          </Link>
        </p>
        <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
          <input
            type="checkbox"
            required
            checked={form.privacyAccepted}
            onChange={(event) => onChange({ ...form, privacyAccepted: event.target.checked })}
            className="mt-0.5 size-4 accent-oboya-blue-dark"
          />
          <span>{t("privacyAccept")}</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
          <input
            type="checkbox"
            checked={form.marketingOptIn}
            onChange={(event) => onChange({ ...form, marketingOptIn: event.target.checked })}
            className="mt-0.5 size-4 accent-oboya-blue-dark"
          />
          <span>{t("marketingOptIn")}</span>
        </label>
      </div>
    </div>
  );
}
