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
    lg: "h-12"
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <img 
          src="/brnout-logo.png" 
          alt="BRNOUT Logo" 
          className={cn("object-contain", sizeClasses[size])} 
        />
      </div>
      {showTagline && (
        <p className="text-xs text-foreground/70 mt-1">LESS STRESS, MORE SUCCESS</p>
      )}
    </div>
  );
};