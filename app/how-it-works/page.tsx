import Link from "next/link";

const steps = [
  { title: "Dylan posts", detail: "A new video lands on YouTube." },
  { title: "Transcript fetched", detail: "History Record pulls the transcript text." },
  { title: "AI scan", detail: "AI identifies history-making events from the transcript." },
  { title: "Events published", detail: "Detected records appear on the events feed." },
];

const orbitPositions = [
  "left-1/2 top-2 -translate-x-1/2",
  "right-2 top-1/2 -translate-y-1/2",
  "left-1/2 bottom-2 -translate-x-1/2",
  "left-2 top-1/2 -translate-y-1/2",
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 text-[var(--page-text)] md:p-6">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">How It Works</h1>
          <p className="text-sm">A simple loop powers every new update.</p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_360px] md:items-center md:gap-10">
          <div className="relative space-y-3 pl-7">
            <div className="absolute bottom-3 left-2 top-3 w-px bg-[var(--page-line)]" />
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-md border border-[var(--page-line)] bg-background/60 p-3">
                <span className="absolute -left-7 top-3 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--page-line)] bg-[var(--page-bg)] text-[9px] font-semibold leading-none">
                  {index + 1}
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Step {index + 1}</p>
                <p className="mt-0.5 text-sm font-medium">{step.title}</p>
                <p className="text-xs text-[var(--page-text-soft)]">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="relative mx-auto h-[296px] w-[296px] md:h-[340px] md:w-[340px]">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--page-line)]" />
            <div className="absolute inset-4 rounded-full border-2 border-dashed border-[var(--page-line)] [animation:spin_20s_linear_infinite]" />

            <svg aria-hidden="true" viewBox="0 0 340 340" className="absolute inset-0 h-full w-full">
              <circle cx="170" cy="170" r="126" fill="none" stroke="var(--page-line)" strokeDasharray="4 9" strokeWidth="1.5" />
              <path d="M170 44 l8 4 -7 5" fill="none" stroke="var(--page-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M296 170 l-4 8 -5 -7" fill="none" stroke="var(--page-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M170 296 l-8 -4 7 -5" fill="none" stroke="var(--page-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M44 170 l4 -8 5 7" fill="none" stroke="var(--page-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`absolute ${orbitPositions[index]} min-w-[106px] rounded-md border border-[var(--page-line)] bg-[var(--page-panel)] px-2 py-1 text-center text-[10px] font-medium uppercase tracking-[0.06em]`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-3 pt-1 text-sm">
          <Link href="/" className="font-medium underline underline-offset-2">
            Back to events
          </Link>
          <a
            href="https://github.com/James-CodeX/dyllan"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub Repo
          </a>
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
