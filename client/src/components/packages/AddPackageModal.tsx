import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Package, Loader2 } from "lucide-react";

interface AddPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPackageModal = ({ open, onOpenChange }: AddPackageModalProps) => {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [planType, setPlanType] = useState("monthly");
  const [duration, setDuration] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  const handleSubmit = async () => {
    if (!packageName.trim() || !monthlyPrice || !duration || !user?.uid) return;

    setCreating(true);
    try {
      const packagesRef = collection(db, 'coaches', user.uid, 'packages');
      
      const monthlyPriceNum = parseFloat(monthlyPrice);
      const durationNum = parseInt(duration);
      const totalPrice = monthlyPriceNum * durationNum;
      
      await addDoc(packagesRef, {
        name: packageName.trim(),
        description: packageDescription.trim(),
        currency,
        planType,
        duration: durationNum,
        totalPrice,
        payoutPerMonth: monthlyPriceNum,
        createdAt: serverTimestamp()
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating package:', error);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setPackageName("");
    setPackageDescription("");
    setCurrency("USD");
    setPlanType("monthly");
    setDuration("");
    setMonthlyPrice("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const totalPrice = monthlyPrice && duration ? 
    (parseFloat(monthlyPrice) * parseInt(duration)).toFixed(2) : "0.00";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5" />
            Add New Package
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new coaching package with pricing and duration details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-white">Package Name</Label>
            <Input
              id="name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., 12-Week Transformation Program"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="Describe what's included in this package..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currency" className="text-white">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="planType" className="text-white">Plan Type</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration" className="text-white">Duration (months)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="12"
                min="1"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monthlyPayout" className="text-white">Monthly Price</Label>
              <Input
                id="monthlyPayout"
                type="number"
                step="0.01"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="200.00"
                min="0"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Package Price:</span>
              <span className="text-2xl font-bold text-white">
                {currency === 'USD' && '$'}
                {currency === 'EUR' && '€'}
                {currency === 'GBP' && '£'}
                {currency === 'CAD' && '$'}
                {totalPrice}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!packageName.trim() || !monthlyPrice || !duration || creating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Package'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};