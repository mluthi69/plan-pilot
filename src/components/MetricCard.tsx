import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export default function MetricCard({ title, value, change, trend = "neutral", subtitle }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 animate-fade-in">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1.5 text-2xl font-semibold text-card-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {change && (
          <>
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
            {trend === "neutral" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span
              className={`text-xs font-medium ${
                trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {change}
            </span>
          </>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
