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
            className="font-medium underline underline-offset-2"
          >
            Support again
          </a>
        </div>
      </section>
    </main>
  );
}
