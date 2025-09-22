import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectAccount: () => void;
}

export function OnboardingModal({ open, onOpenChange, onConnectAccount }: OnboardingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    teamSize: "",
    stage: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/company", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Success",
        description: "Company profile created successfully",
      });
      onOpenChange(false);
      onConnectAccount();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompanyMutation.mutate(formData);
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" data-testid="onboarding-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Welcome to RunwayIQ</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Let's get your startup's financial tracking set up
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Company Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Startup"
                  required
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger data-testid="select-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Select
                  value={formData.teamSize}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teamSize: value }))}
                >
                  <SelectTrigger data-testid="select-team-size">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5 employees">1-5 employees</SelectItem>
                    <SelectItem value="6-15 employees">6-15 employees</SelectItem>
                    <SelectItem value="16-50 employees">16-50 employees</SelectItem>
                    <SelectItem value="50+ employees">50+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger data-testid="select-stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                    <SelectItem value="Seed">Seed</SelectItem>
                    <SelectItem value="Series A">Series A</SelectItem>
                    <SelectItem value="Series B+">Series B+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 2: Account Connection Preview */}
          <div className="space-y-4">
            <h3 className="font-medium">Connect Your Bank Accounts</h3>
            <div className="bg-accent/50 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-shield-alt text-primary"></i>
                <span className="text-sm font-medium">Secure Bank Connection</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                We use bank-level encryption to securely connect to your accounts. 
                We never store your banking credentials.
              </p>
              <Button 
                type="button"
                className="w-full"
                onClick={onConnectAccount}
                data-testid="button-connect-bank-preview"
              >
                <i className="fas fa-university mr-2"></i>
                Connect Bank Account
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSkip}
              data-testid="button-skip-onboarding"
            >
              Skip for now
            </Button>
            <Button 
              type="submit"
              disabled={createCompanyMutation.isPending}
              data-testid="button-continue-setup"
            >
              {createCompanyMutation.isPending ? "Creating..." : "Continue Setup"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
