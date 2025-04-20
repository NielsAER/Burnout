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

  return (
    <div className={cn("inline-flex items-center", className)}>
      <img 
        src={isDarkMode ? "/brnout-logo-light.png" : "/brnout-header-logo.png"}
        alt="BRNOUT Logo" 
        className={cn("object-contain", sizeClasses[size])} 
      />
    </div>
  );
};