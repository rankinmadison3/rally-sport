import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div
      className={cn(
        "w-full mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
