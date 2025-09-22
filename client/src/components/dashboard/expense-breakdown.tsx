import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpenseBreakdownProps {
  data: ExpenseCategory[];
}

const categoryColors = [
  "bg-primary",
  "bg-success", 
  "bg-warning",
  "bg-destructive",
  "bg-chart-5"
];

export function ExpenseBreakdown({ data }: ExpenseBreakdownProps) {
  return (
    <Card className="bg-card border border-border" data-testid="expense-breakdown">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:underline p-0">
          View Details
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((category, index) => (
            <div 
              key={category.category} 
              className="flex items-center justify-between py-2"
              data-testid={`expense-category-${category.category.toLowerCase()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${categoryColors[index % categoryColors.length]}`} />
                <span className="text-sm font-medium">{category.category}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${category.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
          
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expense data available</p>
              <p className="text-xs mt-1">Connect an account to see expense breakdown</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
