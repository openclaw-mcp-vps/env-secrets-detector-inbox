import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

function Progress({ value, className }: ProgressProps): React.ReactElement {
  const bounded = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-800", className)}>
      <div className="h-full bg-teal-400 transition-all" style={{ width: `${bounded}%` }} />
    </div>
  );
}

export { Progress };
