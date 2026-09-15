export function AuthCard({ title, subtitle, children }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl mb-2">{title}</h1>
        {subtitle && <p className="text-inkSoft mb-8">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}

export function AuthInput({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-inkSoft mb-1">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-inkSoft/60 focus:border-accent"
      />
    </label>
  );
}

export function AuthButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-ink py-2.5 text-paper hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}
