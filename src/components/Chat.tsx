
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";
import { toast } from "@/components/ui/sonner";
import { ArrowUp } from "lucide-react";
import LoadingIndicator from "./LoadingIndicator";

interface ChatProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
}

const Chat = ({ onSubmit, isLoading }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      content: "Hello! I'm your AI coding assistant. Describe the application you want to build, and I'll generate the code for you.",
      role: "ai",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add a message to the chat
  const addMessage = (content: string, role: "user" | "ai") => {
    const newMessage: ChatMessageProps = {
      content,
      role,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    // Add user message
    addMessage(inputValue, "user");
    
    const userMessage = inputValue;
    setInputValue("");
    
    try {
      await onSubmit(userMessage);
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Failed to generate code. Please try again.");
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              content={message.content}
              role={message.role}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
            <div className="flex w-full mb-4">
              <div className="bg-ai-darkPanel rounded-2xl py-3 px-4">
                <LoadingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            className="flex-1 bg-ai-darkPanel border-white/10 focus-visible:ring-ai-purple"
            placeholder="Describe the app you want to build..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="bg-ai-purple hover:bg-ai-vibrant text-white"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
