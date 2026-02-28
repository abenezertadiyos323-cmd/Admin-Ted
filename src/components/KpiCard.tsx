// src/components/KpiCard.tsx
interface KpiCardProps {
  title: string;
  value: string | number;
  comparison?: string;
  comparisonColor?: string;
  onClick?: () => void;
}

export default function KpiCard({
  title,
  value,
  comparison,
  comparisonColor = 'text-muted',
  onClick,
}: KpiCardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl p-4 shadow-sm text-left w-full active:scale-[0.98] transition-transform cursor-pointer"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <KpiCardContent title={title} value={value} comparison={comparison} comparisonColor={comparisonColor} />
      </button>
    );
  }
  return (
    <div className="rounded-2xl p-4 shadow-sm text-left w-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <KpiCardContent title={title} value={value} comparison={comparison} comparisonColor={comparisonColor} />
    </div>
  );
}

function KpiCardContent({
  title,
  value,
  comparison,
  comparisonColor,
}: Omit<KpiCardProps, 'onClick'>) {
  return (
    <>
      {/* Title: wraps up to 2 lines, never truncates */}
      <p className="text-xs font-medium leading-snug" style={{ color: 'var(--muted)' }}>
        {title}
      </p>
      {/* Big number */}
      <p className="text-3xl font-bold mt-1 leading-none" style={{ color: 'var(--text)' }}>{value}</p>
      {/* Comparison line */}
      {comparison != null && (
        <p className={`text-xs mt-1.5 leading-snug ${comparisonColor}`}>{comparison}</p>
      )}
    </>
  );
}
