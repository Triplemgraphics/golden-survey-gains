import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Star, DollarSign, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question: string;
  type: string;
  options: string[];
  required: boolean;
}

interface FreeSurveyProps {
  onComplete: () => void;
  onBack: () => void;
  userId: string;
}

const FreeSurvey = ({ onComplete, onBack, userId }: FreeSurveyProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [portfolio, setPortfolio] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const questions: Question[] = [
    {
      id: "q1",
      question: "What is your age range?",
      type: "single_choice",
      options: ["18-24", "25-34", "35-44", "45-54", "55+"],
      required: true
    },
    {
      id: "q2",
      question: "What is your highest level of education?",
      type: "single_choice",
      options: ["Primary", "Secondary", "Certificate/Diploma", "Bachelor's Degree", "Master's Degree", "PhD"],
      required: true
    },
    {
      id: "q3",
      question: "What is your current employment status?",
      type: "single_choice",
      options: ["Employed Full-time", "Employed Part-time", "Self-employed", "Student", "Unemployed", "Retired"],
      required: true
    },
    {
      id: "q4",
      question: "Which county do you live in?",
      type: "single_choice",
      options: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Machakos", "Kiambu", "Other"],
      required: true
    },
    {
      id: "q5",
      question: "How often do you use the internet?",
      type: "single_choice",
      options: ["Daily", "Several times a week", "Once a week", "Few times a month", "Rarely"],
      required: true
    },
    {
      id: "q6",
      question: "What best describes your monthly income range?",
      type: "single_choice",
      options: ["Below Ksh 20,000", "Ksh 20,000 - 50,000", "Ksh 50,000 - 100,000", "Ksh 100,000 - 200,000", "Above Ksh 200,000"],
      required: true
    }
  ];

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: value
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Move to portfolio section
      setCurrentQuestion(questions.length);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (portfolio.trim().length === 0) {
      toast({
        title: "Portfolio Required",
        description: "Please write a short portfolio about yourself.",
        variant: "destructive",
      });
      return;
    }

    if (portfolio.length > 1000) {
      toast({
        title: "Portfolio Too Long",
        description: "Please keep your portfolio under 1000 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create survey response
      const surveyData = {
        user_id: userId,
        survey_id: '00000000-0000-0000-0000-000000000001', // Use the predefined free survey ID
        responses: {
          answers,
          portfolio,
          completed_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('survey_responses')
        .insert(surveyData);

      if (error) throw error;

      // Update user profile with survey completion
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('surveys_completed, total_earnings')
        .eq('user_id', userId)
        .single();

      if (currentProfile) {
        await supabase
          .from('profiles')
          .update({ 
            surveys_completed: (currentProfile.surveys_completed || 0) + 1,
            total_earnings: (currentProfile.total_earnings || 0) + 25 // Ksh 25 for completing free survey
          })
          .eq('user_id', userId);
      }

      // Record earnings
      await supabase
        .from('earnings')
        .insert({
          user_id: userId,
          survey_id: surveyData.survey_id,
          amount: 25,
          status: 'pending'
        });

      setShowResults(true);
      toast({
        title: "Survey Completed!",
        description: "You've earned Ksh 25 for completing the free survey!",
      });

    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPortfolioSection = currentQuestion === questions.length;
  const currentQ = !isPortfolioSection ? questions[currentQuestion] : null;
  const hasAnswer = currentQ ? answers[currentQ.id] : true;

  if (showResults) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50 shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Survey Completed!</h3>
            <p className="text-muted-foreground mb-4">
              Thank you for sharing your information with us.
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold text-green-600">Ksh 25 Earned</span>
            </div>
            <Button onClick={onComplete} className="w-full max-w-sm">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Free Demographics Survey</CardTitle>
                <p className="text-sm text-muted-foreground">Help us understand our community better</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Free
              </Badge>
              <Badge variant="secondary">
                {isPortfolioSection ? 'Portfolio' : `${currentQuestion + 1} of ${questions.length}`}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / (questions.length + 1)) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isPortfolioSection ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">{currentQ!.question}</h3>
              
              <RadioGroup 
                value={answers[currentQ!.id] || ""} 
                onValueChange={handleAnswerChange}
              >
                {currentQ!.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">Tell us about yourself</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Write a short portfolio about yourself, your interests, and what you do. This helps us match you with relevant surveys. 
                (Maximum 1000 characters)
              </p>
              <Textarea
                placeholder="Example: I'm a 25-year-old marketing student in Nairobi. I'm passionate about technology and digital marketing. I enjoy reading about business trends and love trying new products. I work part-time at a local startup while completing my degree..."
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className="min-h-[120px]"
                maxLength={1000}
              />
              <div className="text-right text-xs text-muted-foreground mt-2">
                {portfolio.length}/1000 characters
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={currentQuestion === 0 ? onBack : handlePrevious}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentQuestion === 0 ? "Back" : "Previous"}
              </Button>
            </div>
            
            {isPortfolioSection ? (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || portfolio.trim().length === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Survey"}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!hasAnswer}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreeSurvey;