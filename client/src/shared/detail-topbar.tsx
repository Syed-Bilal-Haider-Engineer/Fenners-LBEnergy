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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft size={15} />
          {backLabel}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
