import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AddPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPackageModal = ({ open, onOpenChange }: AddPackageModalProps) => {
  const [creating, setCreating] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [planType, setPlanType] = useState("");
  const [duration, setDuration] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const planTypes = [
    "1-on-1 Coaching",
    "Group Program", 
    "Online Training",
    "Nutrition Coaching",
    "Custom Program"
  ];

  const currencies = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" }
  ];

  const calculateTotalPrice = () => {
    const pricePerMonth = parseFloat(monthlyPrice) || 0;
    const months = parseInt(duration) || 1;
    return pricePerMonth * months;
  };

  const resetForm = () => {
    setPackageName("");
    setDescription("");
    setCurrency("USD");
    setPlanType("");
    setDuration("");
    setMonthlyPrice("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid || !packageName || !planType || !duration || !monthlyPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const durationNum = parseInt(duration);
    const priceNum = parseFloat(monthlyPrice);

    if (durationNum <= 0) {
      toast({
        title: "Error", 
        description: "Duration must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (priceNum <= 0) {
      toast({
        title: "Error",
        description: "Price must be greater than 0.",
        variant: "destructive", 
      });
      return;
    }

    setCreating(true);
    
    try {
      const packagesRef = collection(db, 'coaches', user.uid, 'packages');
      
      await addDoc(packagesRef, {
        name: packageName,
        description: description || "",
        currency,
        planType,
        duration: durationNum,
        totalPrice: calculateTotalPrice(),
        payoutPerMonth: priceNum,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Package created successfully!",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: "Error",
        description: "Failed to create package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Setup A New Package 📦</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={creating}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex items-center gap-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="font-medium text-blue-600">Setup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm">
              2
            </div>
            <span className="text-gray-500">Automations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm">
              3
            </div>
            <span className="text-gray-500">Benefits</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="packageName" className="text-sm font-medium">
              Package Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="packageName"
              placeholder="90 Day Program"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Package Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Get in the best shape of your life in 90 days 💪"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Currency <span className="text-red-500">*</span>
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Type of plan <span className="text-red-500">*</span>
              </Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Monthly" />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                For how long? <span className="text-red-500">*</span>
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="1 Month" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 12].map((months) => (
                    <SelectItem key={months} value={months.toString()}>
                      {months} Month{months !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Price <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="0.01"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  per month
                </span>
              </div>
            </div>
          </div>

          {duration && monthlyPrice && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total payout for this package:</span>
                <span className="text-lg font-semibold text-blue-600">
                  {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                  {calculateTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !packageName || !planType || !duration || !monthlyPrice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};