import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ForecastScenario {
  name: string;
  revenueGrowth: number;
  burnRate: number;
  runway: number;
  color: string;
}

export default function Forecasting() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("12");
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([
    { name: "Optimistic", revenueGrowth: 25, burnRate: -15, runway: 14.2, color: "hsl(142, 71%, 45%)" },
    { name: "Realistic", revenueGrowth: 10, burnRate: -5, runway: 8.7, color: "hsl(217, 91%, 60%)" },
    { name: "Pessimistic", revenueGrowth: -5, burnRate: 10, runway: 6.2, color: "hsl(0, 84%, 60%)" },
  ]);
  
  const chartRef = useRef<HTMLCanvasElement>(null);

  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial-summary"],
    retry: false,
  });

  const updateScenario = (index: number, field: keyof ForecastScenario, value: number) => {
    setScenarios(prev => prev.map((scenario, i) => 
      i === index ? { ...scenario, [field]: value } : scenario
    ));
  };

  const calculateRunway = (revenueGrowth: number, burnRate: number) => {
    if (!financialSummary) return 0;
    
    const currentBalance = (financialSummary as any).totalBalance;
    const currentBurn = (financialSummary as any).monthlyBurn;
    const currentRevenue = (financialSummary as any).monthlyRevenue;
    
    const newRevenue = currentRevenue * (1 + revenueGrowth / 100);
    const newBurn = currentBurn * (1 + burnRate / 100);
    const netBurn = newBurn - newRevenue;
    
    return netBurn > 0 ? currentBalance / netBurn : 999;
  };

  useEffect(() => {
    // Recalculate runway when scenarios change
    setScenarios(prev => prev.map(scenario => ({
      ...scenario,
      runway: calculateRunway(scenario.revenueGrowth, scenario.burnRate)
    })));
  }, [financialSummary]);

  useEffect(() => {
    if (!chartRef.current || !financialSummary) return;

    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRef.current!.getContext('2d');
      if (!ctx) return;

      Chart.getChart(ctx)?.destroy();

      const months = parseInt(timeRange);
      const labels = Array.from({ length: months + 1 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      });

      const datasets = scenarios.map(scenario => {
        const data = [];
        let currentBalance = (financialSummary as any).totalBalance;
        const monthlyRevenue = (financialSummary as any).monthlyRevenue * (1 + scenario.revenueGrowth / 100);
        const monthlyBurn = (financialSummary as any).monthlyBurn * (1 + scenario.burnRate / 100);
        const netBurn = monthlyBurn - monthlyRevenue;
        
        data.push(currentBalance);
        
        for (let i = 1; i <= months; i++) {
          currentBalance = Math.max(0, currentBalance - netBurn);
          data.push(currentBalance);
        }
        
        return {
          label: scenario.name,
          data,
          borderColor: scenario.color,
          backgroundColor: scenario.color + '20',
          fill: false,
          tension: 0.4
        };
      });

      new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'hsl(240, 6%, 90%)' },
              ticks: {
                callback: function(value: any) {
                  return '$' + (value / 1000) + 'k';
                }
              }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                }
              }
            }
          }
        }
      });
    });
  }, [scenarios, timeRange, financialSummary]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Forecasting"
          subtitle="Interactive runway projections and scenario planning"
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32" data-testid="select-time-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <main className="flex-1 overflow-auto p-6">
          {!financialSummary ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-bar text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">No financial data available</h3>
                <p className="text-muted-foreground">
                  Connect an account and add transactions to generate runway forecasts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Current Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">${(financialSummary as any).totalBalance.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Monthly Burn</p>
                    <p className="text-2xl font-bold text-destructive">${(financialSummary as any).monthlyBurn.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-success">${(financialSummary as any).monthlyRevenue.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Runway</p>
                    <p className="text-2xl font-bold">{(financialSummary as any).runwayMonths.toFixed(1)} months</p>
                  </div>
                </Card>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Runway Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <canvas ref={chartRef} data-testid="forecast-chart" />
                    </div>
                  </CardContent>
                </Card>

                {/* Scenario Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        {scenarios.map((scenario, index) => (
                          <TabsTrigger key={index} value={index.toString()} className="text-xs">
                            {scenario.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {scenarios.map((scenario, index) => (
                        <TabsContent key={index} value={index.toString()} className="space-y-4 mt-6">
                          <div className="text-center mb-4">
                            <h3 className="font-semibold text-lg">{scenario.name} Scenario</h3>
                            <p className="text-2xl font-bold" style={{ color: scenario.color }}>
                              {scenario.runway.toFixed(1)} months
                            </p>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">
                                Revenue Growth: {scenario.revenueGrowth}%
                              </Label>
                              <Slider
                                value={[scenario.revenueGrowth]}
                                onValueChange={([value]) => updateScenario(index, 'revenueGrowth', value)}
                                min={-50}
                                max={100}
                                step={5}
                                className="mt-2"
                                data-testid={`slider-revenue-${index}`}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">
                                Burn Rate Change: {scenario.burnRate}%
                              </Label>
                              <Slider
                                value={[scenario.burnRate]}
                                onValueChange={([value]) => updateScenario(index, 'burnRate', value)}
                                min={-50}
                                max={50}
                                step={5}
                                className="mt-2"
                                data-testid={`slider-burn-${index}`}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Scenario Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Scenario</th>
                          <th className="text-right py-2">Revenue Growth</th>
                          <th className="text-right py-2">Burn Change</th>
                          <th className="text-right py-2">Projected Runway</th>
                          <th className="text-right py-2">vs Current</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((scenario, index) => {
                          const runwayDiff = scenario.runway - (financialSummary as any).runwayMonths;
                          return (
                            <tr key={index} className="border-b">
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: scenario.color }}
                                  />
                                  {scenario.name}
                                </div>
                              </td>
                              <td className="text-right py-2 font-medium">
                                {scenario.revenueGrowth > 0 ? '+' : ''}{scenario.revenueGrowth}%
                              </td>
                              <td className="text-right py-2 font-medium">
                                {scenario.burnRate > 0 ? '+' : ''}{scenario.burnRate}%
                              </td>
                              <td className="text-right py-2 font-bold">
                                {scenario.runway.toFixed(1)} months
                              </td>
                              <td className={`text-right py-2 font-medium ${
                                runwayDiff > 0 ? 'text-success' : runwayDiff < 0 ? 'text-destructive' : ''
                              }`}>
                                {runwayDiff > 0 ? '+' : ''}{runwayDiff.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <i className="fas fa-lightbulb text-warning mt-0.5"></i>
                      <div>
                        <p className="font-medium">Burn Rate Impact</p>
                        <p className="text-muted-foreground">
                          A 10% reduction in burn rate could extend your runway by {
                            (calculateRunway(0, -10) - (financialSummary as any).runwayMonths).toFixed(1)
                          } months.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <i className="fas fa-chart-line text-success mt-0.5"></i>
                      <div>
                        <p className="font-medium">Revenue Growth</p>
                        <p className="text-muted-foreground">
                          Growing revenue by 20% could add {
                            (calculateRunway(20, 0) - (financialSummary as any).runwayMonths).toFixed(1)
                          } months to your runway.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <i className="fas fa-clock text-primary mt-0.5"></i>
                      <div>
                        <p className="font-medium">Break-even Point</p>
                        <p className="text-muted-foreground">
                          At current revenue growth, you need to reduce burn by {
                            Math.max(0, (((financialSummary as any).monthlyBurn - (financialSummary as any).monthlyRevenue) / (financialSummary as any).monthlyBurn * 100)).toFixed(0)
                          }% to reach break-even.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
