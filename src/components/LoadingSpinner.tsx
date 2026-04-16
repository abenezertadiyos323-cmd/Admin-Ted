import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ 
  size = "md", 
  className = "" 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string;
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizes[size]} animate-spin text-primary`} 
        style={{ strokeWidth: 3 }}
      />
    </div>
  );
}
