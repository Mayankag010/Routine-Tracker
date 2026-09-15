export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="font-display text-3xl mb-3">You're offline</h1>
        <p className="text-inkSoft">
          This page hasn't been loaded before, so there's nothing cached to
          show. Pages you've already visited — like your dashboard and
          routines — will still open, and any ticks you make there will sync
          once you're back online.
        </p>
      </div>
    </main>
  );
}
