import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const Logo = ({ 
  className, 
  size = "md",
  showTagline = false 
}: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16"
  };

  return (
    <div className={cn("inline-flex items-center", className)}>
      <img 
        src="/brnout-header-logo.png" 
        alt="BRNOUT Logo" 
        className={cn("object-contain", sizeClasses[size])} 
      />
    </div>
  );
};