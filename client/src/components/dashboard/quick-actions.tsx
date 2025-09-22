import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuickActionsProps {
  onConnectAccount: () => void;
  onCreateBudget: () => void;
  onExportReport: () => void;
  onBulkEdit: () => void;
}

export function QuickActions({ 
  onConnectAccount, 
  onCreateBudget, 
  onExportReport, 
  onBulkEdit 
}: QuickActionsProps) {
  const actions = [
    {
      icon: "fas fa-plus-circle text-primary",
      title: "Connect Account",
      description: "Link new bank account",
      onClick: onConnectAccount,
      testId: "button-connect-account"
    },
    {
      icon: "fas fa-calculator text-success",
      title: "Create Budget",
      description: "Set spending limits", 
      onClick: onCreateBudget,
      testId: "button-create-budget"
    },
    {
      icon: "fas fa-download text-warning",
      title: "Export Report",
      description: "Download financials",
      onClick: onExportReport,
      testId: "button-export-report"
    },
    {
      icon: "fas fa-edit text-destructive",
      title: "Bulk Edit",
      description: "Manage transactions",
      onClick: onBulkEdit,
      testId: "button-bulk-edit"
    }
  ];

  // Mock alerts data - in real app this would come from props
  const alerts = [
    {
      type: "error",
      title: "Budget Alert",
      description: "Engineering budget 85% used",
      icon: "fas fa-exclamation-triangle"
    },
    {
      type: "warning", 
      title: "Sync Required",
      description: "Account data is 2 days old",
      icon: "fas fa-info-circle"
    }
  ];

  return (
    <Card className="bg-card border border-border" data-testid="quick-actions">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full flex items-center gap-3 p-3 text-left h-auto justify-start hover:bg-accent transition-colors"
              onClick={action.onClick}
              data-testid={action.testId}
            >
              <i className={action.icon}></i>
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>

        {/* Alerts Section */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium mb-3 text-sm">Recent Alerts</h4>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert 
                key={index}
                className={`p-2 ${
                  alert.type === 'error' 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : 'bg-warning/10 border-warning/20'
                }`}
                data-testid={`alert-${alert.type}-${index}`}
              >
                <div className="flex items-start gap-2">
                  <i className={`${alert.icon} text-${alert.type === 'error' ? 'destructive' : 'warning'} text-xs mt-1`}></i>
                  <div>
                    <AlertDescription className={`text-xs font-medium text-${alert.type === 'error' ? 'destructive' : 'warning'}`}>
                      {alert.title}
                    </AlertDescription>
                    <AlertDescription className="text-xs text-muted-foreground">
                      {alert.description}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
