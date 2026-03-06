"use client";

import { useState } from "react";
import Link from "next/link";
import { getLocaleFromBrowser, type Locale } from "../../lib/i18n";
import { useEffect } from "react";

export default function ContactPage() {
  const [locale, setLocale] = useState<Locale>("ja");
  useEffect(() => setLocale(getLocaleFromBrowser()), []);

  const t = locale === "ja"
    ? {
        title: "お問い合わせ",
        subtitle: "大規模利用・API連携・導入相談は以下のフォームにご記入のうえ、送信内容をメールでお送りください。",
        nameLabel: "お名前",
        namePlaceholder: "山田 太郎",
        emailLabel: "メールアドレス",
        emailPlaceholder: "example@company.co.jp",
        messageLabel: "お問い合わせ内容",
        messagePlaceholder: "ご用件・ご要望をご記入ください。",
        submit: "送信内容を表示",
        copy: "内容をコピー",
        sendMail: "メールで送る",
        back: "トップへ戻る",
        composedTitle: "以下の内容でメールをお送りください",
        composedDesc: "「メールで送る」を押すとメールソフトが開きます。宛先はご自身のメールアドレスをBCCに追加するか、担当者へ転送してください。",
      }
    : {
        title: "Contact",
        subtitle: "For enterprise, API, or bulk use, please fill out the form and send the content via email.",
        nameLabel: "Name",
        namePlaceholder: "John Doe",
        emailLabel: "Email",
        emailPlaceholder: "you@company.com",
        messageLabel: "Message",
        messagePlaceholder: "Your inquiry or request.",
        submit: "Show content",
        copy: "Copy to clipboard",
        sendMail: "Send via email",
        back: "Back to top",
        composedTitle: "Send the following via email",
        composedDesc: "Click \"Send via email\" to open your mail client. BCC yourself or forward to your contact.",
      };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showComposed, setShowComposed] = useState(false);
  const [copied, setCopied] = useState(false);

  const composedText = [
    `【${t.title}】`,
    "",
    `${t.nameLabel}: ${name || "—"}`,
    `${t.emailLabel}: ${email || "—"}`,
    "",
    `${t.messageLabel}:`,
    message || "—",
  ].join("\n");

  const mailtoHref = `mailto:${encodeURIComponent(email || "info@example.com")}?subject=${encodeURIComponent(`【お問い合わせ】${name || "（お名前未記入）"}`)}&body=${encodeURIComponent(composedText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(composedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080a] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />
      <div className="relative z-10 mx-auto max-w-xl px-4 py-16 sm:py-24">
        <h1 className="text-center text-2xl font-semibold text-white sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-3 text-center text-sm text-zinc-500">
          {t.subtitle}
        </p>

        {!showComposed ? (
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-zinc-400">
                  {t.nameLabel}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder:text-zinc-600 focus:border-white/[0.15] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-zinc-400">
                  {t.emailLabel}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder:text-zinc-600 focus:border-white/[0.15] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-zinc-400">
                  {t.messageLabel}
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  className="mt-1.5 w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder:text-zinc-600 focus:border-white/[0.15] focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setShowComposed(true)}
                className="rounded-xl bg-white py-3 px-6 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                {t.submit}
              </button>
              <Link
                href="/"
                className="rounded-xl border border-white/[0.12] bg-white/[0.04] py-3 px-6 text-center text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                {t.back}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <h2 className="text-lg font-semibold text-white">{t.composedTitle}</h2>
            <p className="mt-2 text-xs text-zinc-500">{t.composedDesc}</p>
            <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-black/20 p-4 text-sm text-zinc-300">
              {composedText}
            </pre>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border border-white/[0.12] bg-white/[0.06] py-2.5 px-5 text-sm font-medium text-white hover:bg-white/[0.1]"
              >
                {copied ? (locale === "ja" ? "コピーしました" : "Copied") : t.copy}
              </button>
              <a
                href={mailtoHref}
                className="rounded-xl bg-white py-2.5 px-5 text-sm font-semibold text-black hover:bg-zinc-100"
              >
                {t.sendMail}
              </a>
              <button
                type="button"
                onClick={() => setShowComposed(false)}
                className="rounded-xl border border-white/[0.08] py-2.5 px-5 text-sm text-zinc-400 hover:text-white"
              >
                {locale === "ja" ? "編集に戻る" : "Back to edit"}
              </button>
            </div>
            <div className="mt-6">
              <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
                ← {t.back}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
