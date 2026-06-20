import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function DetailTopbar({
  backHref,
  backLabel,
  title,
  subtitle,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className=" mt-2 z-10 mb-4 flex items-start justify-between bg-transparent pt-2 pb-3">
      {/* Left */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-graphite-600 hover:text-graphite-900"
        >
          <ChevronLeft size={15} />
          {backLabel}
        </Link>

        <h1 className="mt-1 text-xl font-semibold tracking-tight text-graphite-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-0.5 text-sm text-graphite-600">{subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}