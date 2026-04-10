import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 44 }).map((_, index) => (
          <span
            key={index}
            className="absolute top-[-12%] block h-3 w-1.5 rounded-sm opacity-85"
            style={{
              left: `${(index * 13) % 100}%`,
              backgroundColor: ["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#f48fb1"][index % 5],
              animation: `confetti-fall ${4.5 + (index % 6)}s linear ${(index % 12) * 0.22}s infinite`,
            }}
          />
        ))}
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4 border-2 border-[var(--page-line)] bg-[var(--page-panel)] p-6 text-[var(--page-text)]">
        <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Thank You</h1>
        <p className="text-sm leading-relaxed">Thank you for supporting History Record. Your generosity means a lot.</p>
        <div className="flex flex-wrap gap-3 pt-1 text-sm">
          <Link href="/" className="font-medium underline underline-offset-2">
            Back to events
          </Link>
          <a
            href="https://paystack.shop/pay/7kw8vdkm7a"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
          >
            Buy me a Coffee
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 6h9a1 1 0 0 1 1 1v5a5 5 0 0 1-5 5H8a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1z" />
              <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
              <path d="M8 20h9" />
            </svg>
          </a>
        </div>
      </section>
    </main>
  );
}
