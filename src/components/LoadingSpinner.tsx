interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClass} border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
    </div>
  );
}
