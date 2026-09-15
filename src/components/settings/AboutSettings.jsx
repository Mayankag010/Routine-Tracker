"use client";

export function AboutSettings() {
  return (
    <div>
      <h2 className="font-display text-2xl mb-6">About</h2>

      <div className="mb-8">
        <p className="font-display text-xl mb-1">Routine Tracker</p>
        <p className="text-sm text-inkSoft">Version v1.0.0</p>
      </div>

      <p className="text-sm text-inkSoft max-w-md mb-8">
        Routine Tracker helps you build and keep daily habits — schedule routines, check
        them off, and watch your streaks and completion trends build up over time.
      </p>

      <ul className="divide-y divide-line border-t border-line max-w-sm">
        {[
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of Service", href: "#" },
          { label: "Contact / Feedback", href: "mailto:support@example.com" },
        ].map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className="flex items-center justify-between py-3 text-sm text-ink hover:text-accent transition-colors"
            >
              {item.label}
              <span className="text-inkSoft">›</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
