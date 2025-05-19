
import LoadingIndicator from "@/components/LoadingIndicator";

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay = ({ message }: LoadingOverlayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg bg-opacity-95 z-10">
      <LoadingIndicator className="mb-4" />
      <p className="text-sm text-ai-grayText mb-1">{message}</p>
      <p className="text-xs text-ai-grayText opacity-70">This may take a few moments...</p>
    </div>
  );
};

export default LoadingOverlay;
