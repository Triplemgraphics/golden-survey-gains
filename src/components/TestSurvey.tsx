import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  type: string;
  options: string[];
  required: boolean;
  correct_answer?: string;
}

interface TestSurveyProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

const TestSurvey = ({ onComplete, onSkip }: TestSurveyProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const questions: Question[] = [
    {
      id: "test1",
      question: "Which company is the largest telecommunications provider in Kenya?",
      type: "single_choice",
      options: ["Safaricom", "Airtel", "Telkom Kenya", "Jamii Telecommunications"],
      required: true,
      correct_answer: "Safaricom"
    },
    {
      id: "test2", 
      question: "What is the name of Safaricom's mobile money service?",
      type: "single_choice",
      options: ["M-Shwari", "M-Pesa", "KCB-MPESA", "Airtel Money"],
      required: true,
      correct_answer: "M-Pesa"
    },
    {
      id: "test3",
      question: "Which of these is a major Kenyan bank?",
      type: "single_choice",
      options: ["Equity Bank", "Standard Bank", "First National Bank", "Access Bank"],
      required: true,
      correct_answer: "Equity Bank"
    },
    {
      id: "test4",
      question: "What is the main brewery company in Kenya?",
      type: "single_choice", 
      options: ["Kenya Breweries", "East African Breweries Limited", "Tusker Breweries", "Kenya Beer Company"],
      required: true,
      correct_answer: "East African Breweries Limited"
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
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = () => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    
    if (finalScore >= 75) {
      toast({
        title: "Great job!",
        description: `You scored ${finalScore}%! You're ready for paid surveys.`,
      });
    } else {
      toast({
        title: "Keep learning!",
        description: `You scored ${finalScore}%. Take some time to learn about Kenya's major companies.`,
        variant: "destructive",
      });
    }
  };

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const hasAnswer = answers[currentQ.id];

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50 shadow-elegant">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
              {score >= 75 ? (
                <CheckCircle className="w-8 h-8 text-primary-foreground" />
              ) : (
                <XCircle className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <CardTitle className="text-2xl">Test Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">{score}%</div>
            <p className="text-muted-foreground">
              You got {questions.filter(q => answers[q.id] === q.correct_answer).length} out of {questions.length} questions correct.
            </p>
            
            {score >= 75 ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Excellent! You're ready to start earning from surveys.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Keep learning about Kenya's major companies to improve your survey responses.
                </p>
              </div>
            )}
            
            <Button onClick={() => onComplete(score)} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-border/50 shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Knowledge Assessment</CardTitle>
                <p className="text-sm text-muted-foreground">Test your knowledge of Kenya's major companies</p>
              </div>
            </div>
            <Badge variant="secondary">
              {currentQuestion + 1} of {questions.length}
            </Badge>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
            
            <RadioGroup 
              value={answers[currentQ.id] || ""} 
              onValueChange={handleAnswerChange}
            >
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button variant="ghost" onClick={onSkip}>
                Skip Test
              </Button>
            </div>
            
            <Button 
              onClick={handleNext}
              disabled={!hasAnswer}
            >
              {isLastQuestion ? "Finish" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSurvey;