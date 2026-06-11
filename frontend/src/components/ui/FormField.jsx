export default function FormField({
  label,
  id,
  children,
  hint,
  className = '',
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-left text-xs font-semibold tracking-wide text-cocode-heading/70 uppercase"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-left text-xs text-cocode-text/70">{hint}</p>
      )}
    </div>
  )
}

export const inputClassName =
  'w-full rounded-lg border border-cocode-mint bg-white px-4 py-3 text-cocode-heading shadow-sm transition outline-none placeholder:text-cocode-text/50 focus:border-cocode-mint-deep focus:ring-2 focus:ring-cocode-mint-deep/15'

export const selectClassName = inputClassName
