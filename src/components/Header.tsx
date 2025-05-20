
import { cn } from "@/lib/utils";
import ApiEndpointConfig from "@/components/ApiEndpointConfig";

interface HeaderProps {
  className?: string;
  apiEndpoint: string;
  onApiEndpointChange: (endpoint: string) => void;
}

const Header = ({ className, apiEndpoint, onApiEndpointChange }: HeaderProps) => {
  return (
    <header className={cn("flex items-center p-4 border-b border-border", className)}>
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-md bg-ai-purple flex items-center justify-center mr-3 animate-pulse-glow">
          <span className="text-white font-semibold">AI</span>
        </div>
        <h1 className="text-xl font-semibold text-gradient-primary">Synth</h1>
        <span className="text-xs bg-ai-darkPanel px-2 py-0.5 rounded-full text-ai-grayText ml-2">
          alpha
        </span>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <ApiEndpointConfig 
          onEndpointChange={onApiEndpointChange}
          currentEndpoint={apiEndpoint}
        />
        <div className="text-sm text-ai-grayText hidden md:block">
          AI-powered application builder
        </div>
      </div>
    </header>
  );
};

export default Header;
