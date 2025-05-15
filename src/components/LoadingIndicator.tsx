
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  className?: string;
}

const LoadingIndicator = ({ className }: LoadingIndicatorProps) => {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="w-2 h-2 rounded-full bg-ai-purple animate-loading-dot-1"></div>
      <div className="w-2 h-2 rounded-full bg-ai-purple animate-loading-dot-2"></div>
      <div className="w-2 h-2 rounded-full bg-ai-purple animate-loading-dot-3"></div>
    </div>
  );
};

export default LoadingIndicator;
