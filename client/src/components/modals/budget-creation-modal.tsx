import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BudgetCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetCreationModal({ open, onOpenChange }: BudgetCreationModalProps) {
  const [formData, setFormData] = useState({
    category: "",
    monthlyLimit: "",
    alertThreshold: "80"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/budgets", {
        category: data.category,
        monthlyLimit: parseFloat(data.monthlyLimit),
        alertThreshold: parseInt(data.alertThreshold),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
      onOpenChange(false);
      setFormData({ category: "", monthlyLimit: "", alertThreshold: "80" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.monthlyLimit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createBudgetMutation.mutate(formData);
  };

  const categories = [
    "Engineering",
    "Marketing", 
    "Operations",
    "Sales",
    "Legal",
    "Office & Equipment",
    "Travel",
    "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4" data-testid="budget-creation-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Budget</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Set spending limits and alerts for expense categories
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger data-testid="select-budget-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="monthlyLimit">Monthly Limit ($)</Label>
            <Input
              id="monthlyLimit"
              type="number"
              min="0"
              step="0.01"
              value={formData.monthlyLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
              placeholder="5000.00"
              required
              data-testid="input-monthly-limit"
            />
          </div>

          <div>
            <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
            <Select
              value={formData.alertThreshold}
              onValueChange={(value) => setFormData(prev => ({ ...prev, alertThreshold: value }))}
            >
              <SelectTrigger data-testid="select-alert-threshold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Get alerted when spending reaches this percentage of your budget
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-budget"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createBudgetMutation.isPending}
              data-testid="button-create-budget"
            >
              {createBudgetMutation.isPending ? "Creating..." : "Create Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
