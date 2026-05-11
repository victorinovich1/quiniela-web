export default function PageHeader({
  title,
  subtitle,
  label,
  action,
}: {
  title: string
  subtitle?: string | React.ReactNode
  label?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center mb-6">
      {label && <span className="label-up">{label}</span>}
      <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mt-1">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-white/60 mt-2 max-w-md mx-auto">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
