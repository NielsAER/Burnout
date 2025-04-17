import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16"
  };
  
  const taglineSizeClasses = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm"
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative">
        <img 
          src="/brnout-logo-transparent.png" 
          alt="BRNOUT Logo" 
          className={cn("object-contain", sizeClasses[size])} 
        />
      </div>
      {showTagline && (
        <p className={cn(
          "text-coral-500 font-semibold mt-1",
          taglineSizeClasses[size]
        )}>
          LESS STRESS, MORE SUCCESS
        </p>
      )}
    </div>
  );
};