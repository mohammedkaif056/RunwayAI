import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Report } from "@shared/schema";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState("financial_summary");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial-summary"],
  });

  const { data: expenseBreakdown = [] } = useQuery({
    queryKey: ["/api/expense-breakdown"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest("POST", "/api/reports", reportData);
      return response.json();
    },
    onSuccess: (data) => {
      // In a real app, this would trigger a download or redirect to the report
      toast({
        title: "Success",
        description: `Report "${data.fileName}" generated successfully`,
      });
      
      // Simulate download by creating a blob URL
      const reportContent = JSON.stringify(data.data, null, 2);
      const blob = new Blob([reportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const reportTypes = [
    { value: "financial_summary", label: "Financial Summary", description: "Overview of income, expenses, and cash flow" },
    { value: "runway_analysis", label: "Runway Analysis", description: "Detailed runway projections and scenarios" },
    { value: "expense_breakdown", label: "Expense Breakdown", description: "Category-wise expense analysis" },
    { value: "transaction_history", label: "Transaction History", description: "Complete transaction listing" },
    { value: "budget_performance", label: "Budget Performance", description: "Budget vs actual spending analysis" }
  ];

  const formats = [
    { value: "pdf", label: "PDF", icon: "fas fa-file-pdf" },
    { value: "csv", label: "CSV", icon: "fas fa-file-csv" },
    { value: "excel", label: "Excel", icon: "fas fa-file-excel" }
  ];

  const handleGenerateReport = () => {
    if (!financialSummary) {
      toast({
        title: "Error",
        description: "No financial data available. Connect an account first.",
        variant: "destructive",
      });
      return;
    }

    const reportData = {
      type: reportType,
      format: reportFormat,
      data: getReportData(reportType),
      fileName: `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.${reportFormat}`
    };

    generateReportMutation.mutate(reportData);
  };

  const getReportData = (type: string) => {
    switch (type) {
      case "financial_summary":
        return {
          summary: financialSummary,
          dateRange,
          generatedAt: new Date().toISOString()
        };
      case "expense_breakdown":
        return {
          breakdown: expenseBreakdown,
          total: (expenseBreakdown as any[]).reduce((sum: number, item: any) => sum + item.amount, 0),
          dateRange,
          generatedAt: new Date().toISOString()
        };
      case "runway_analysis":
        return {
          currentRunway: (financialSummary as any)?.runwayMonths || 0,
          scenarios: [
            { name: "Optimistic", runway: ((financialSummary as any)?.runwayMonths || 0) * 1.4 },
            { name: "Realistic", runway: (financialSummary as any)?.runwayMonths || 0 },
            { name: "Pessimistic", runway: ((financialSummary as any)?.runwayMonths || 0) * 0.7 }
          ],
          dateRange,
          generatedAt: new Date().toISOString()
        };
      default:
        return {
          dateRange,
          generatedAt: new Date().toISOString()
        };
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "financial_summary": return "fas fa-chart-bar";
      case "runway_analysis": return "fas fa-plane-departure";
      case "expense_breakdown": return "fas fa-pie-chart";
      case "transaction_history": return "fas fa-list";
      case "budget_performance": return "fas fa-calculator";
      default: return "fas fa-file";
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case "pdf": return "text-red-500 bg-red-50";
      case "csv": return "text-green-500 bg-green-50";
      case "excel": return "text-blue-500 bg-blue-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Reports"
            subtitle="Generate and download financial reports"
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Reports"
          subtitle="Generate and download financial reports"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Generator */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type Selection */}
                <div>
                  <h3 className="font-medium mb-3">Select Report Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reportTypes.map(type => (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          reportType === type.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setReportType(type.value)}
                        data-testid={`report-type-${type.value}`}
                      >
                        <div className="flex items-start gap-3">
                          <i className={`${getReportIcon(type.value)} text-primary mt-1`}></i>
                          <div>
                            <p className="font-medium text-sm">{type.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <h3 className="font-medium mb-3">Export Format</h3>
                  <div className="flex gap-3">
                    {formats.map(format => (
                      <Button
                        key={format.value}
                        variant={reportFormat === format.value ? "default" : "outline"}
                        onClick={() => setReportFormat(format.value)}
                        data-testid={`format-${format.value}`}
                      >
                        <i className={`${format.icon} mr-2`}></i>
                        {format.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="font-medium mb-3">Date Range</h3>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal" data-testid="button-date-range">
                        <i className="fas fa-calendar mr-2"></i>
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Pick a date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending || !financialSummary}
                    className="w-full"
                    data-testid="button-generate-report"
                  >
                    <i className="fas fa-download mr-2"></i>
                    {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType("financial_summary");
                    setReportFormat("pdf");
                    handleGenerateReport();
                  }}
                  data-testid="button-quick-financial-summary"
                >
                  <i className="fas fa-chart-bar mr-2"></i>
                  Monthly Summary (PDF)
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType("expense_breakdown");
                    setReportFormat("csv");
                    handleGenerateReport();
                  }}
                  data-testid="button-quick-expense-breakdown"
                >
                  <i className="fas fa-pie-chart mr-2"></i>
                  Expense Data (CSV)
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setReportType("runway_analysis");
                    setReportFormat("pdf");
                    handleGenerateReport();
                  }}
                  data-testid="button-quick-runway-analysis"
                >
                  <i className="fas fa-plane-departure mr-2"></i>
                  Runway Analysis (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          {reports.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 10).map(report => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      data-testid={`recent-report-${report.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`${getReportIcon(report.type)} text-muted-foreground`}></i>
                        <div>
                          <p className="font-medium text-sm">{report.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                            <Badge className={`text-xs ${getFormatColor(report.format)}`} variant="secondary">
                              {report.format.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`download-report-${report.id}`}>
                        <i className="fas fa-download w-4 h-4"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Financial Data Warning */}
          {!financialSummary && (
            <Card className="mt-6 border-warning/20 bg-warning/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle text-warning"></i>
                  <div>
                    <p className="font-medium">No financial data available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect a bank account and add transactions to generate meaningful reports.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
