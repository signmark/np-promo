import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  Share2, 
  Users, 
  Target,
  MessageSquare 
} from "lucide-react";

type WizardStep = {
  title: string;
  description: string;
};

const WIZARD_STEPS: WizardStep[] = [
  {
    title: "Выбор платформы",
    description: "Выберите социальные сети для публикации контента"
  },
  {
    title: "Целевая аудитория",
    description: "Определите вашу целевую аудиторию и её интересы"
  },
  {
    title: "Тип контента",
    description: "Выберите формат контента для каждой платформы"
  },
  {
    title: "Генерация идей",
    description: "Анализ трендов и генерация идей для постов"
  }
];

export function ContentWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Мастер создания контента
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index === currentStep
                    ? "text-primary"
                    : index < currentStep
                    ? "text-muted-foreground"
                    : "text-muted"
                }`}
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background mb-2">
                  {index === 0 && <Share2 className="w-5 h-5" />}
                  {index === 1 && <Users className="w-5 h-5" />}
                  {index === 2 && <Target className="w-5 h-5" />}
                  {index === 3 && <MessageSquare className="w-5 h-5" />}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {WIZARD_STEPS[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {WIZARD_STEPS[currentStep].description}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === WIZARD_STEPS.length - 1}
            >
              Далее
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
