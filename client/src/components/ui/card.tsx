import { HTMLAttributes } from "react";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ className, padded = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white shadow-panel dark:bg-graphite-800",
        padded && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-[15px] font-bold text-graphite-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-graphite-600/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
