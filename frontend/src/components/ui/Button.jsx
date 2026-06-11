const variants = {
  primary:
    'bg-linear-to-r from-cocode-mint-deep to-cocode-accent text-white shadow-[0_4px_16px_rgba(26,122,82,0.35)] hover:shadow-[0_6px_24px_rgba(26,122,82,0.45)] hover:-translate-y-px hover:brightness-105',
  secondary:
    'border border-cocode-mint bg-white text-cocode-heading shadow-sm hover:border-cocode-mint-deep/40 hover:bg-cocode-cream',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300',
  ghost: 'text-cocode-heading hover:bg-cocode-mint/40',
}

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
