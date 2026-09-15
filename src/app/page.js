import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-xl">Routine</span>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/login" className="text-inkSoft hover:text-ink">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-4 py-2 text-paper hover:bg-accentSoft transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col justify-center px-6 md:px-12 max-w-3xl">
        <p className="text-inkSoft mb-3">Every day, ticked off.</p>
        <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
          A place to keep your routines honest.
        </h1>
        <p className="text-inkSoft text-lg max-w-xl mb-8">
          Add the habits you want to keep, choose their days, and mark each one
          off as you go. See your week, your month, and where you're
          actually consistent.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-ink px-6 py-3 text-paper hover:brightness-110 transition-colors"
          >
            Start tracking
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors"
          >
            I have an account
          </Link>
        </div>
      </section>

      <footer className="px-6 py-6 md:px-12 text-sm text-inkSoft border-t border-line">
        Built to be used every day.
      </footer>
    </main>
  );
}
