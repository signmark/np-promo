import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  ArrowLeft, 
  Share2, 
  Users, 
  Target,
  MessageSquare,
  Play
} from "lucide-react";
import { 
  SiVk, 
  SiTelegram, 
  SiYoutube
} from "react-icons/si";

type Platform = "vkontakte" | "telegram" | "youtube" | "rutube";

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

const PLATFORMS: { id: Platform; name: string; icon: React.ElementType }[] = [
  { id: "vkontakte", name: "ВКонтакте", icon: SiVk },
  { id: "telegram", name: "Telegram", icon: SiTelegram },
  { id: "youtube", name: "YouTube", icon: SiYoutube },
  { id: "rutube", name: "Rutube", icon: Play }
];

export function ContentWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());

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

  const togglePlatform = (platform: Platform) => {
    const newSelection = new Set(selectedPlatforms);
    if (newSelection.has(platform)) {
      newSelection.delete(platform);
    } else {
      newSelection.add(platform);
    }
    setSelectedPlatforms(newSelection);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-4">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <div
                  key={platform.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => togglePlatform(platform.id)}
                >
                  <Checkbox
                    checked={selectedPlatforms.has(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <Icon className="w-6 h-6" />
                  <Label className="cursor-pointer">{platform.name}</Label>
                </div>
              );
            })}
          </div>
        );
      // Other steps will be implemented later
      default:
        return (
          <div className="text-center text-muted-foreground">
            Этот шаг находится в разработке
          </div>
        );
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
          <div className="min-h-[300px]">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">
                {WIZARD_STEPS[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {WIZARD_STEPS[currentStep].description}
              </p>
            </div>

            <div className="mt-8">
              {renderStepContent()}
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
              disabled={currentStep === WIZARD_STEPS.length - 1 || (currentStep === 0 && selectedPlatforms.size === 0)}
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