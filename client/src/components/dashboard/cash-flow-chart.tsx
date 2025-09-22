import { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CashFlowChartProps {
  data?: {
    labels: string[];
    actual: number[];
    projected: number[];
  };
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    // Import Chart.js dynamically to avoid SSR issues
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      Chart.getChart(ctx)?.destroy();

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Actual Balance',
            data: data.actual,
            borderColor: 'hsl(217, 91%, 60%)',
            backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
            fill: true,
            tension: 0.4
          }, {
            label: 'Projected',
            data: data.projected,
            borderColor: 'hsl(240, 3%, 46%)',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                color: 'hsl(240, 6%, 90%)'
              },
              ticks: {
                callback: function(value: any) {
                  return '$' + (value / 1000) + 'k';
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
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
  }, [data]);

  return (
    <Card className="bg-card border border-border" data-testid="cash-flow-chart">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Cash Flow Projection</CardTitle>
        <Select defaultValue="6-months">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6-months">6 months</SelectItem>
            <SelectItem value="12-months">12 months</SelectItem>
            <SelectItem value="18-months">18 months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <canvas ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  );
}
