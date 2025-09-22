import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconColor?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon,
  iconColor = "text-success"
}: MetricCardProps) {
  const changeColorClass = {
    positive: "text-success",
    negative: "text-destructive", 
    neutral: "text-muted-foreground"
  }[changeType];

  const changeIcon = {
    positive: "fas fa-arrow-up",
    negative: "fas fa-arrow-down",
    neutral: ""
  }[changeType];

  return (
    <Card className="metric-card p-6 border border-border" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <i className={`${icon} ${iconColor}`}></i>
      </div>
      <p className="text-3xl font-bold text-foreground" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </p>
      {change && (
        <p className={`text-sm mt-1 ${changeColorClass}`}>
          {changeIcon && <i className={`${changeIcon} mr-1`}></i>}
          <span>{change}</span>
        </p>
      )}
    </Card>
  );
}
