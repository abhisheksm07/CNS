export default function Panel({ children, className = "", title, icon: Icon }) {
  return (
    <section className={`glass neon-border rounded-lg ${className}`}>
      {title && (
        <div className="flex items-center gap-2 border-b border-cyanline/15 px-4 py-3 font-display text-xs uppercase tracking-[0.22em] text-cyan-100">
          {Icon && <Icon className="h-4 w-4 text-cyanline" />}
          {title}
        </div>
      )}
      {children}
    </section>
  );
}
