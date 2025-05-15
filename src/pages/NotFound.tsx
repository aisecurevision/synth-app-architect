
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ai-darkBg text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-gradient-primary">404</h1>
        <p className="text-xl text-ai-grayText mb-8">
          Oops! This page doesn't exist in any universe
        </p>
        <Button asChild className="bg-ai-purple hover:bg-ai-vibrant">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
