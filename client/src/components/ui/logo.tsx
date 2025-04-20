import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import lightLogo from "@assets/brnout-logo-light.png";
import darkLogo from "@assets/brnout-header-logo.png";

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
    sm: "h-10",
    md: "h-14",
    lg: "h-20"
  };

  return (
    <div className={cn("inline-flex items-center py-2", className)}>
      <img 
        src={isDarkMode ? lightLogo : darkLogo}
        alt="BRNOUT Logo" 
        className={cn("object-contain", sizeClasses[size])} 
      />
    </div>
  );
};