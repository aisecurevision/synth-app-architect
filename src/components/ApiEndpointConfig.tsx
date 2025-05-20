
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface ApiEndpointConfigProps {
  onEndpointChange: (endpoint: string) => void;
  currentEndpoint: string;
}

const API_ENDPOINT_KEY = "llm_api_endpoint";

const ApiEndpointConfig = ({ onEndpointChange, currentEndpoint }: ApiEndpointConfigProps) => {
  const [endpoint, setEndpoint] = useState(currentEndpoint);
  const [open, setOpen] = useState(false);

  // Load saved endpoint from localStorage on component mount
  useEffect(() => {
    const savedEndpoint = localStorage.getItem(API_ENDPOINT_KEY);
    if (savedEndpoint) {
      setEndpoint(savedEndpoint);
      onEndpointChange(savedEndpoint);
    }
  }, [onEndpointChange]);

  const handleSave = () => {
    if (!endpoint.trim()) {
      toast.error("API endpoint cannot be empty.");
      return;
    }

    // Validate URL format
    try {
      new URL(endpoint);
      
      // Save to localStorage and update app state
      localStorage.setItem(API_ENDPOINT_KEY, endpoint);
      onEndpointChange(endpoint);
      toast.success("API endpoint saved successfully.");
      setOpen(false);
    } catch (error) {
      toast.error("Please enter a valid URL.");
    }
  };

  const handleReset = () => {
    const defaultEndpoint = "http://127.0.0.1:1234/v1/chat/completions";
    setEndpoint(defaultEndpoint);
    localStorage.setItem(API_ENDPOINT_KEY, defaultEndpoint);
    onEndpointChange(defaultEndpoint);
    toast.success("API endpoint reset to default.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-transparent border-white/10 hover:bg-white/5 mr-2"
        >
          <Settings className="h-4 w-4 mr-2" />
          LLM API Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure LLM API Endpoint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Endpoint URL</label>
            <Input
              placeholder="http://127.0.0.1:1234/v1/chat/completions"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-ai-grayText">
              Enter the endpoint where your LLM server is running. Default is http://127.0.0.1:1234/v1/chat/completions
            </p>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <Button onClick={handleSave}>
              Save Endpoint
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiEndpointConfig;
