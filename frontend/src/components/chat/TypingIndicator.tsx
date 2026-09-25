export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" aria-label="CiberGuardián está escribiendo">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
