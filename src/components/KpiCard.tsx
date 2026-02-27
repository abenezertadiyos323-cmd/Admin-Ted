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
  comparisonColor = 'text-gray-400',
  onClick,
}: KpiCardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 text-left w-full active:scale-[0.98] transition-transform cursor-pointer"
      >
        <KpiCardContent title={title} value={value} comparison={comparison} comparisonColor={comparisonColor} />
      </button>
    );
  }
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 text-left w-full">
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
      <p className="text-xs text-gray-500 font-medium leading-snug">
        {title}
      </p>
      {/* Big number */}
      <p className="text-3xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
      {/* Comparison line */}
      {comparison != null && (
        <p className={`text-xs mt-1.5 leading-snug ${comparisonColor}`}>{comparison}</p>
      )}
    </>
  );
}
