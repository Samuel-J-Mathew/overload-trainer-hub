import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Database, Loader2 } from "lucide-react";

export const SeedTemplatesButton = () => {
  const [seeding, setSeeding] = useState(false);
  const { user } = useAuth();

  const globalTemplates = [
    {
      title: "Initial Assessment",
      description: "A comprehensive form to understand your client's goals, habits, and readiness.",
      questions: [
        { questionText: "What are your primary fitness goals?", responseType: "text", required: true, order: 1 },
        { questionText: "What is your current activity level?", responseType: "scale", required: true, order: 2 },
        { questionText: "Do you have any injuries or physical limitations?", responseType: "textarea", required: false, order: 3 },
        { questionText: "How many days per week can you commit to exercise?", responseType: "number", required: true, order: 4 },
        { questionText: "What motivates you to stay active?", responseType: "textarea", required: false, order: 5 },
        { questionText: "Do you have access to a gym or fitness equipment?", responseType: "yesNo", required: true, order: 6 },
        { questionText: "What is your experience with weight training?", responseType: "scale", required: true, order: 7 },
        { questionText: "How would you rate your current nutrition habits?", responseType: "starRating", required: true, order: 8 },
        { questionText: "What time of day do you prefer to work out?", responseType: "text", required: false, order: 9 },
        { questionText: "Any additional comments or goals?", responseType: "textarea", required: false, order: 10 }
      ]
    },
    {
      title: "PAR-Q Health Screening",
      description: "Physical Activity Readiness Questionnaire for health screening and safety assessment.",
      questions: [
        { questionText: "Has your doctor ever said that you have a heart condition?", responseType: "yesNo", required: true, order: 1 },
        { questionText: "Do you feel pain in your chest when you do physical activity?", responseType: "yesNo", required: true, order: 2 },
        { questionText: "In the past month, have you had chest pain when not doing physical activity?", responseType: "yesNo", required: true, order: 3 },
        { questionText: "Do you lose your balance because of dizziness or do you ever lose consciousness?", responseType: "yesNo", required: true, order: 4 },
        { questionText: "Do you have a bone or joint problem that could be made worse by physical activity?", responseType: "yesNo", required: true, order: 5 },
        { questionText: "Is your doctor currently prescribing drugs for blood pressure or heart condition?", responseType: "yesNo", required: true, order: 6 },
        { questionText: "Do you know of any other reason you should not do physical activity?", responseType: "yesNo", required: true, order: 7 },
        { questionText: "What is your age?", responseType: "number", required: true, order: 8 },
        { questionText: "Emergency contact name and phone number", responseType: "text", required: true, order: 9 }
      ]
    },
    {
      title: "Client Feedback Survey", 
      description: "Gather feedback on training programs, coaching experience, and client satisfaction.",
      questions: [
        { questionText: "How satisfied are you with your current training program?", responseType: "starRating", required: true, order: 1 },
        { questionText: "What aspects of the program are working well for you?", responseType: "textarea", required: false, order: 2 },
        { questionText: "What would you like to change or improve?", responseType: "textarea", required: false, order: 3 },
        { questionText: "How would you rate your energy levels since starting?", responseType: "scale", required: true, order: 4 },
        { questionText: "Are you seeing the results you expected?", responseType: "yesNo", required: true, order: 5 },
        { questionText: "How would you rate the coaching communication?", responseType: "starRating", required: true, order: 6 },
        { questionText: "Is the program difficulty appropriate for your fitness level?", responseType: "scale", required: true, order: 7 },
        { questionText: "Any additional comments or suggestions?", responseType: "textarea", required: false, order: 8 }
      ]
    }
  ];

  const handleSeedTemplates = async () => {
    if (!user?.uid) return;
    
    setSeeding(true);
    
    try {
      for (const template of globalTemplates) {
        // Create the template document
        const templateRef = await addDoc(collection(db, 'questionnaireTemplates'), {
          title: template.title,
          description: template.description,
          createdAt: serverTimestamp()
        });
        
        console.log(`Created template: ${template.title} with ID: ${templateRef.id}`);
        
        // Add questions as subcollection
        const questionsRef = collection(db, 'questionnaireTemplates', templateRef.id, 'questions');
        
        for (const question of template.questions) {
          await addDoc(questionsRef, {
            questionText: question.questionText,
            responseType: question.responseType,
            required: question.required,
            order: question.order
          });
        }
        
        console.log(`Added ${template.questions.length} questions to ${template.title}`);
      }
      
      console.log('Successfully seeded all global templates!');
      alert('Global templates have been created successfully!');
    } catch (error) {
      console.error('Error seeding templates:', error);
      alert('Error creating templates. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Button
      onClick={handleSeedTemplates}
      disabled={seeding}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      {seeding ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Creating Templates...
        </>
      ) : (
        <>
          <Database className="w-4 h-4 mr-2" />
          Seed Global Templates
        </>
      )}
    </Button>
  );
};