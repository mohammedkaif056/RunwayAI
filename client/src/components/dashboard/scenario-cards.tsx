import { Card, CardContent } from "@/components/ui/card";

interface Scenario {
  type: "optimistic" | "realistic" | "pessimistic";
  runwayMonths: number;
  revenueGrowth: number;
  burnChange: number;
}

interface ScenarioCardsProps {
  scenarios: Scenario[];
}

export function ScenarioCards({ scenarios }: ScenarioCardsProps) {
  const getScenarioStyle = (type: string) => {
    switch (type) {
      case "optimistic":
        return {
          icon: "fas fa-arrow-up text-success",
          title: "text-success",
          border: ""
        };
      case "realistic":
        return {
          icon: "fas fa-minus text-primary",
          title: "text-primary",
          border: "border-primary"
        };
      case "pessimistic":
        return {
          icon: "fas fa-arrow-down text-destructive", 
          title: "text-destructive",
          border: ""
        };
      default:
        return {
          icon: "fas fa-minus text-muted-foreground",
          title: "text-muted-foreground",
          border: ""
        };
    }
  };

  const formatChange = (value: number, isPositive: boolean) => {
    const sign = value >= 0 ? "+" : "";
    const color = isPositive ? (value >= 0 ? "text-success" : "text-destructive") : (value >= 0 ? "text-destructive" : "text-success");
    return <span className={color}>{sign}{value}%</span>;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" data-testid="scenario-cards">
      {scenarios.map((scenario) => {
        const style = getScenarioStyle(scenario.type);
        return (
          <Card 
            key={scenario.type} 
            className={`bg-card p-6 border border-border ${style.border}`}
            data-testid={`scenario-${scenario.type}`}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-2 mb-4">
                <i className={style.icon}></i>
                <h4 className={`font-semibold capitalize ${style.title}`}>
                  {scenario.type}
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Runway</span>
                  <span className="text-sm font-medium">
                    {scenario.runwayMonths.toFixed(1)} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue Growth</span>
                  <span className="text-sm font-medium">
                    {formatChange(scenario.revenueGrowth, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {scenario.burnChange >= 0 ? 'Burn Increase' : 'Burn Reduction'}
                  </span>
                  <span className="text-sm font-medium">
                    {formatChange(Math.abs(scenario.burnChange), scenario.burnChange < 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
