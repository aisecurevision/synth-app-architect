
import LoadingIndicator from "@/components/LoadingIndicator";

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
}

const LoadingOverlay = ({ message, subMessage }: LoadingOverlayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg/95 z-10">
      <div className="flex flex-col items-center">
        <LoadingIndicator className="mb-4" />
        <p className="text-sm text-white font-medium mb-1">{message}</p>
        <p className="text-xs text-ai-grayText">
          {subMessage || "This may take a few moments..."}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
