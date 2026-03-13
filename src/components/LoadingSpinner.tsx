import { Loader2 } from "lucide-react";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export default LoadingSpinner;
