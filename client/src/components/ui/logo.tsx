import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import brnoutLogo from "@assets/brnout.png";

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
    sm: "h-10",
    md: "h-14",
    lg: "w-full h-auto" // Made the logo width match the text width
  };

  return (
    <div className={cn("inline-flex items-center", className)}>
      <img 
        src={brnoutLogo}
        alt="BRNOUT Logo" 
        className={cn("object-contain object-center", sizeClasses[size])} 
      />
    </div>
  );
};