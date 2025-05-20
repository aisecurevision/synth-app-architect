
import LoadingIndicator from "@/components/LoadingIndicator";

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
}

const LoadingOverlay = ({ message, subMessage }: LoadingOverlayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg/95 z-50">
      <div className="flex flex-col items-center bg-ai-darkPanel p-6 rounded-lg shadow-lg border border-ai-purple/30">
        <LoadingIndicator className="mb-4" />
        <p className="text-md text-white font-medium mb-2">{message}</p>
        <p className="text-sm text-ai-grayText text-center">
          {subMessage || "This may take a few moments..."}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
