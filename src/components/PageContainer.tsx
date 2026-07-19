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
        "w-full mx-auto max-w-7xl px-5 py-6 md:px-10 md:py-10 lg:px-12",
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
