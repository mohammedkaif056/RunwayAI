import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

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
      toast({
        title: "Success",
        description: `Report "${data.fileName}" generated and downloaded!`,
      });
      
      // Refresh reports list to show the new report
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      // Create and download a proper report file with formatted content
      let reportContent = "";
      const reportData = data.data;
      
      if (reportFormat === "pdf" || reportFormat === "csv") {
        // Generate formatted content
        reportContent = generateFormattedReport(reportType, reportData);
      } else {
        // For Excel format, use JSON
        reportContent = JSON.stringify(reportData, null, 2);
      }
      
      const mimeType = reportFormat === "csv" ? "text/csv" : 
                      reportFormat === "excel" ? "application/json" : "text/plain";
      
      const blob = new Blob([reportContent], { type: mimeType });
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

  const generateFormattedReport = (type: string, data: any) => {
    const reportTitle = reportTypes.find(rt => rt.value === type)?.label || type;
    const timestamp = new Date().toLocaleString();
    
    if (reportFormat === "csv") {
      // Generate CSV format
      switch (type) {
        case "financial_summary":
          return `Report Type,Value\n` +
            `Total Balance,$${data.summary?.totalBalance?.toLocaleString() || '125,000'}\n` +
            `Monthly Revenue,$${data.summary?.monthlyRevenue?.toLocaleString() || '45,000'}\n` +
            `Monthly Burn,$${data.summary?.monthlyBurn?.toLocaleString() || '78,000'}\n` +
            `Runway Months,${data.summary?.runwayMonths?.toFixed(1) || '8.2'}\n` +
            `Generated,${timestamp}\n`;
            
        case "expense_breakdown":
          let csv = `Category,Amount,Percentage\n`;
          if (data.breakdown) {
            data.breakdown.forEach((item: any) => {
              csv += `${item.category},$${item.amount?.toLocaleString() || '0'},${item.percentage?.toFixed(1) || '0'}%\n`;
            });
          }
          csv += `\nTotal Expenses,$${data.total?.toLocaleString() || '0'}\n`;
          csv += `Generated,${timestamp}\n`;
          return csv;
          
        case "runway_analysis":
          let runwayCsv = `Scenario,Runway (Months),Assumptions\n`;
          if (data.scenarios) {
            data.scenarios.forEach((s: any) => {
              runwayCsv += `${s.name},${s.runway?.toFixed(1) || '0'},"${s.assumptions || 'N/A'}"\n`;
            });
          }
          runwayCsv += `\nGenerated,${timestamp}\n`;
          return runwayCsv;
          
        default:
          return `${reportTitle}\nGenerated: ${timestamp}\n\n${JSON.stringify(data, null, 2)}`;
      }
    } else {
      // Generate text format (for PDF or readable format)
      const header = `${reportTitle}\n${'='.repeat(reportTitle.length)}\n`;
      
      switch (type) {
        case "financial_summary":
          return `${header}Generated: ${timestamp}\n\n` +
            `FINANCIAL OVERVIEW\n` +
            `Total Balance: $${data.summary?.totalBalance?.toLocaleString() || '125,000'}\n` +
            `Monthly Revenue: $${data.summary?.monthlyRevenue?.toLocaleString() || '45,000'}\n` +
            `Monthly Burn: $${data.summary?.monthlyBurn?.toLocaleString() || '78,000'}\n` +
            `Runway: ${data.summary?.runwayMonths?.toFixed(1) || '8.2'} months\n\n` +
            `HEALTH STATUS\n` +
            `${(data.summary?.runwayMonths || 8.2) > 12 ? '✅ Healthy - Runway > 12 months' : 
              (data.summary?.runwayMonths || 8.2) > 6 ? '⚠️ Caution - Runway 6-12 months' : '🚨 Critical - Runway < 6 months'}\n\n` +
            `COMPANY INFO\n` +
            `Name: ${data.companyInfo?.name || 'TechFlow Startup'}\n` +
            `Stage: ${data.companyInfo?.stage || 'Pre-seed'}\n` +
            `Industry: ${data.companyInfo?.industry || 'SaaS'}\n`;
                    
        case "expense_breakdown":
          let breakdown = `${header}Generated: ${timestamp}\n\n`;
          breakdown += `EXPENSE SUMMARY\n`;
          breakdown += `Total Expenses: $${data.total?.toLocaleString() || '71,000'}\n\n`;
          breakdown += `CATEGORY BREAKDOWN\n`;
          if (data.breakdown && data.breakdown.length > 0) {
            data.breakdown.forEach((item: any) => {
              breakdown += `${item.category}: $${item.amount?.toLocaleString() || '0'} (${item.percentage?.toFixed(1) || '0'}%)\n`;
            });
          } else {
            breakdown += "Engineering: $25,000 (35.2%)\n";
            breakdown += "Operations: $18,000 (25.4%)\n";
            breakdown += "Marketing: $12,000 (16.9%)\n";
            breakdown += "Legal: $8,000 (11.3%)\n";
            breakdown += "Office & Equipment: $8,000 (11.3%)\n";
          }
          if (data.insights) {
            breakdown += `\nINSIGHTS\n`;
            data.insights.forEach((insight: string) => {
              breakdown += `• ${insight}\n`;
            });
          }
          return breakdown;
        
        case "runway_analysis":
          return `${header}Generated: ${timestamp}\n\n` +
            `CURRENT RUNWAY\n` +
            `${data.currentRunway?.toFixed(1) || '8.2'} months at current burn rate\n\n` +
            `SCENARIO ANALYSIS\n` +
            (data.scenarios?.map((s: any) => `${s.name}: ${s.runway?.toFixed(1) || '0'} months - ${s.assumptions || 'N/A'}`).join('\n') || 
             'Optimistic: 11.5 months - +25% revenue growth, -15% burn\nRealistic: 8.2 months - Current trajectory\nPessimistic: 5.7 months - -10% revenue, +20% burn') + '\n\n' +
            `RECOMMENDATIONS\n` +
            (data.recommendations?.map((r: string) => `• ${r}`).join('\n') || 
             '• Focus on revenue growth to extend runway\n• Monitor burn rate closely\n• Consider fundraising if runway drops below 6 months');
          
        default:
          return `${header}Generated: ${timestamp}\n\nReport data:\n${JSON.stringify(data, null, 2)}`;
      }
    }
  };

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
          summary: financialSummary || {
            totalBalance: 125000,
            monthlyRevenue: 45000,
            monthlyBurn: 78000,
            runwayMonths: 8.2
          },
          dateRange,
          generatedAt: new Date().toISOString(),
          companyInfo: {
            name: "TechFlow Startup",
            stage: "Pre-seed",
            industry: "SaaS"
          }
        };
      case "expense_breakdown":
        const mockBreakdown = (expenseBreakdown as any[]).length > 0 ? (expenseBreakdown as any[]) : [
          { category: "Engineering", amount: 25000, percentage: 35.2 },
          { category: "Operations", amount: 18000, percentage: 25.4 },
          { category: "Marketing", amount: 12000, percentage: 16.9 },
          { category: "Legal", amount: 8000, percentage: 11.3 },
          { category: "Office & Equipment", amount: 8000, percentage: 11.3 }
        ];
        return {
          breakdown: mockBreakdown,
          total: mockBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0),
          dateRange,
          generatedAt: new Date().toISOString(),
          insights: [
            "Engineering represents the largest expense category",
            "Consider optimizing cloud infrastructure costs",
            "Marketing spend is within industry benchmarks"
          ]
        };
      case "runway_analysis":
        const currentRunway = (financialSummary as any)?.runwayMonths || 8.2;
        return {
          currentRunway,
          scenarios: [
            { 
              name: "Optimistic", 
              runway: currentRunway * 1.4,
              assumptions: "+25% revenue growth, -15% burn reduction"
            },
            { 
              name: "Realistic", 
              runway: currentRunway,
              assumptions: "Current trajectory maintained"
            },
            { 
              name: "Pessimistic", 
              runway: currentRunway * 0.7,
              assumptions: "-10% revenue, +20% burn increase"
            }
          ],
          dateRange,
          generatedAt: new Date().toISOString(),
          recommendations: [
            "Focus on revenue growth to extend runway",
            "Monitor burn rate closely in pessimistic scenario",
            "Consider fundraising if runway drops below 6 months"
          ]
        };
      case "transaction_history":
        return {
          totalTransactions: 156,
          dateRange,
          generatedAt: new Date().toISOString(),
          summary: {
            totalIncome: 125000,
            totalExpenses: 87000,
            netCashFlow: 38000
          }
        };
      case "budget_performance":
        return {
          budgets: [
            { category: "Engineering", budgeted: 25000, actual: 23400, variance: -6.4 },
            { category: "Marketing", budgeted: 8000, actual: 9200, variance: 15.0 },
            { category: "Operations", budgeted: 15000, actual: 14100, variance: -6.0 }
          ],
          dateRange,
          generatedAt: new Date().toISOString(),
          overallPerformance: "96% budget adherence"
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

                <div className="pt-4">
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
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

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="font-medium">
                    {reportTypes.find(rt => rt.value === reportType)?.label}
                  </div>
                  {reportType === "financial_summary" && (
                    <div className="space-y-2 text-muted-foreground">
                      <div>• Current Balance: ${((financialSummary as any)?.totalBalance || 125000).toLocaleString()}</div>
                      <div>• Monthly Revenue: ${((financialSummary as any)?.monthlyRevenue || 45000).toLocaleString()}</div>
                      <div>• Monthly Burn: ${((financialSummary as any)?.monthlyBurn || 78000).toLocaleString()}</div>
                      <div>• Runway: {((financialSummary as any)?.runwayMonths || 8.2).toFixed(1)} months</div>
                    </div>
                  )}
                  {reportType === "expense_breakdown" && (
                    <div className="space-y-2 text-muted-foreground">
                      <div>• Engineering: $25,000 (35.2%)</div>
                      <div>• Operations: $18,000 (25.4%)</div>
                      <div>• Marketing: $12,000 (16.9%)</div>
                      <div>• + 2 more categories</div>
                    </div>
                  )}
                  {reportType === "runway_analysis" && (
                    <div className="space-y-2 text-muted-foreground">
                      <div>• Optimistic: {(((financialSummary as any)?.runwayMonths || 8.2) * 1.4).toFixed(1)} months</div>
                      <div>• Realistic: {((financialSummary as any)?.runwayMonths || 8.2).toFixed(1)} months</div>
                      <div>• Pessimistic: {(((financialSummary as any)?.runwayMonths || 8.2) * 0.7).toFixed(1)} months</div>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {reportFormat.toUpperCase()} Format
                    </Badge>
                  </div>
                </div>
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

          {/* Demo Data Preview */}
          {(!financialSummary || (financialSummary as any)?.totalBalance === 0) && (
            <Card className="mt-6 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <i className="fas fa-info-circle text-blue-600"></i>
                  <div>
                    <p className="font-medium text-blue-800">Using Demo Data for Reports</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Reports will include sample startup financial data. Connect real accounts for live data.
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
