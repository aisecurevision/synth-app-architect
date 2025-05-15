
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
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
      <div className="ml-auto text-sm text-ai-grayText">
        AI-powered application builder
      </div>
    </header>
  );
};

export default Header;
