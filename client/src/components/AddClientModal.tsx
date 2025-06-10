import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, X } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const addClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  tag: z.string().optional(),
  questionnaire: z.string().optional(),
  onboarding: z.string().optional(),
  setDates: z.boolean().default(false),
  emailInstructions: z.boolean().default(false),
  currentWeight: z.string().optional(),
  goalWeight: z.string().optional(),
  goal: z.string().optional(),
});

type AddClientFormData = z.infer<typeof addClientSchema>;

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddClientModal = ({ open, onOpenChange }: AddClientModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Current coach user
  const { toast } = useToast();

  const form = useForm<AddClientFormData>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      name: "",
      email: "",
      tag: "",
      questionnaire: "",
      onboarding: "",
      setDates: false,
      emailInstructions: false,
      currentWeight: "",
      goalWeight: "",
      goal: "",
    },
  });

  const onSubmit = async (data: AddClientFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add clients.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Create Firebase Auth user for the client
      const clientAuthResult = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        "password" // Default password
      );
      
      const clientUID = clientAuthResult.user.uid;
      const [firstName, ...lastNameParts] = data.name.split(" ");
      const lastName = lastNameParts.join(" ");

      // Step 2: Create user document in /users/{uid}
      await setDoc(doc(db, "users", clientUID), {
        uid: clientUID,
        email: data.email,
        firstName: firstName || data.name,
        lastName: lastName || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Step 3: Add client to coach's client list in /coaches/{coachUID}/clients/{clientUID}
      const clientData = {
        uid: clientUID,
        name: data.name,
        email: data.email,
        tag: data.tag || null,
        goal: data.goal || null,
        currentWeight: data.currentWeight ? parseFloat(data.currentWeight) : null,
        goalWeight: data.goalWeight ? parseFloat(data.goalWeight) : null,
        questionnaire: data.questionnaire || null,
        onboarding: data.onboarding || null,
        setDates: data.setDates,
        emailInstructions: data.emailInstructions,
        duration: "active",
        lastActive: new Date(),
        lastCheckin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "coaches", user.uid, "clients", clientUID), clientData);

      // Step 4: Also add to the main clients collection for easy querying
      await setDoc(doc(db, "clients", clientUID), {
        ...clientData,
        coachUID: user.uid,
      });

      toast({
        title: "Success",
        description: `Client ${data.name} added successfully! They can now log in with email: ${data.email} and password: "password"`,
      });
      
      form.reset();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-gray-400" />
              <DialogTitle>Add Client</DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-1" />
                Add multiple clients
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogDescription>
            Create a new client account with Firebase authentication and add them to your coaching roster.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Client Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Type your clients name"
                      {...field}
                      className="hubfit-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Client Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Type your clients email"
                      {...field}
                      className="hubfit-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Tag</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client tag(s)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionnaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Questionnaire Form</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a questionnaire form(s)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic Assessment</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="onboarding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Onboarding Flow</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an onboarding flow" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard Onboarding</SelectItem>
                      <SelectItem value="premium">Premium Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Goal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Lose 10kg, Build muscle, Get stronger"
                      {...field}
                      className="hubfit-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="70"
                        {...field}
                        className="hubfit-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goalWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="65"
                        {...field}
                        className="hubfit-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="setDates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Set client start and end date?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailInstructions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Email client the login instructions (you can do this later)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button type="submit" disabled={isSubmitting} className="hubfit-primary">
                {isSubmitting ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
