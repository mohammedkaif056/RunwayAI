import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountConnectionModal({ open, onOpenChange }: AccountConnectionModalProps) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountType: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/connect-account", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      toast({
        title: "Success",
        description: "Account connected successfully",
      });
      onOpenChange(false);
      setFormData({ bankName: "", accountType: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountType) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    connectAccountMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4" data-testid="account-connection-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Connect Bank Account</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate connecting a bank account (Demo Mode)
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
              placeholder="Chase, Wells Fargo, etc."
              required
              data-testid="input-bank-name"
            />
          </div>
          
          <div>
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
            >
              <SelectTrigger data-testid="select-account-type">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 text-sm mt-0.5"></i>
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium">Demo Mode</p>
                <p>This will create a simulated bank account with sample transactions for testing purposes.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-connection"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={connectAccountMutation.isPending}
              data-testid="button-connect-account"
            >
              {connectAccountMutation.isPending ? "Connecting..." : "Connect Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
