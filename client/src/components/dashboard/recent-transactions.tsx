import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onRecategorize: (transactionId: string) => void;
}

export function RecentTransactions({ transactions, onRecategorize }: RecentTransactionsProps) {
  const formatAmount = (amount: string, type: string) => {
    const value = parseFloat(amount);
    const isNegative = value < 0 || type === 'expense';
    const displayValue = Math.abs(value);
    
    return {
      value: `${isNegative ? '-' : '+'}$${displayValue.toLocaleString()}`,
      className: isNegative ? 'text-destructive' : 'text-success'
    };
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-muted';
    
    const colors: Record<string, string> = {
      'Engineering': 'bg-primary/20 text-primary',
      'Marketing': 'bg-success/20 text-success',
      'Operations': 'bg-warning/20 text-warning',
      'Revenue': 'bg-success/20 text-success',
    };
    
    return colors[category] || 'bg-muted';
  };

  return (
    <Card className="lg:col-span-2 bg-card border border-border" data-testid="recent-transactions">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <i className="fas fa-filter mr-1"></i>
            Filter
          </Button>
          <Button variant="ghost" size="sm" className="text-primary hover:underline p-0">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const amount = formatAmount(transaction.amount, transaction.type);
            return (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    <i className="fas fa-credit-card text-muted-foreground"></i>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      {transaction.category && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(transaction.category)}`}
                        >
                          {transaction.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${amount.className}`}>
                    {amount.value}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary hover:underline p-0 mt-1"
                    onClick={() => onRecategorize(transaction.id)}
                    data-testid={`button-recategorize-${transaction.id}`}
                  >
                    Recategorize
                  </Button>
                </div>
              </div>
            );
          })}
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions available</p>
              <p className="text-xs mt-1">Connect an account to see your transactions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
