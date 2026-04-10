import Link from "next/link";

const steps = [
  { title: "Dylan posts", detail: "A new video lands on YouTube." },
  { title: "Transcript fetched", detail: "History Record pulls the transcript text." },
  { title: "AI scan", detail: "AI identifies history-making events from the transcript." },
  { title: "Events published", detail: "Detected records appear on the events feed." },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 border-2 border-[var(--page-line)] bg-[var(--page-panel)] p-6 text-[var(--page-text)]">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">How It Works</h1>
          <p className="text-sm">A simple loop powers every new update.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-center">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="border-b-2 border-[var(--page-line)] pb-2 last:border-b-0 last:pb-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Step {index + 1}</p>
                <p className="mt-0.5 text-sm font-medium">{step.title}</p>
                <p className="text-xs text-[var(--page-text-soft)]">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full border-2 border-[var(--page-line)]">
            <div className="flex h-[154px] w-[154px] items-center justify-center rounded-full border-2 border-dashed border-[var(--page-line)] text-center text-xs font-medium uppercase tracking-[0.08em]">
              Dylan posts
              <br />
              Transcript
              <br />
              AI
              <br />
              Events
              <br />
              Repeat
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-3 pt-1 text-sm">
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
        </footer>
      </section>
    </main>
  );
}
