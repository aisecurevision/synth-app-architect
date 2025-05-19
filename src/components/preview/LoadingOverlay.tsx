
import LoadingIndicator from "@/components/LoadingIndicator";

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay = ({ message }: LoadingOverlayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg bg-opacity-90 z-10">
      <LoadingIndicator className="mb-4" />
      <p className="text-sm text-ai-grayText">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
