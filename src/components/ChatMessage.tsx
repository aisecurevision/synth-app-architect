
import { cn } from "@/lib/utils";
import { Code } from "lucide-react";

export type MessageRole = 'user' | 'ai';

export interface ChatMessageProps {
  content: string;
  role: MessageRole;
  timestamp?: Date;
}

const ChatMessage = ({ content, role, timestamp }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex w-full mb-4 animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl py-2 px-4",
        isUser ? "bg-primary text-primary-foreground" : "bg-ai-darkPanel text-foreground"
      )}>
        {!isUser && (
          <div className="flex items-center mb-1">
            <Code className="h-4 w-4 mr-2 text-ai-purple" />
            <span className="text-xs font-medium text-ai-purple">AI Assistant</span>
          </div>
        )}
        <p className="text-sm">{content}</p>
        {timestamp && (
          <div className="text-xs opacity-70 mt-1 text-right">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
