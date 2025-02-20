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
  SiYoutube,
  SiInstagram
} from "react-icons/si";

type Platform = "vkontakte" | "telegram" | "youtube" | "rutube" | "instagram";

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

const PLATFORMS: { id: Platform; name: string; icon: React.ElementType; color: string }[] = [
  { id: "vkontakte", name: "ВКонтакте", icon: SiVk, color: "text-blue-500" },
  { id: "telegram", name: "Telegram", icon: SiTelegram, color: "text-sky-500" },
  { id: "youtube", name: "YouTube", icon: SiYoutube, color: "text-red-500" },
  { id: "instagram", name: "Instagram", icon: SiInstagram, color: "text-pink-500" },
  { id: "rutube", name: "Rutube", icon: Play, color: "text-slate-700" }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.has(platform.id);
              return (
                <div
                  key={platform.id}
                  className={`
                    flex items-center space-x-4 p-6 rounded-xl border-2 
                    transition-all duration-200 cursor-pointer
                    ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    hover:shadow-lg hover:scale-[1.02] transform
                  `}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePlatform(platform.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-7 h-7 ${platform.color}`} />
                      <Label className="cursor-pointer text-lg font-medium">
                        {platform.name}
                      </Label>
                    </div>
                  </div>
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
    <Card className="border-2">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">
          Мастер создания контента
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
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
              <div className={`
                relative flex items-center justify-center w-10 h-10 
                rounded-full border-2 bg-background mb-2
                ${index === currentStep ? 'border-primary' : 'border-muted'}
                transition-colors duration-200
              `}>
                {index === 0 && <Share2 className="w-5 h-5" />}
                {index === 1 && <Users className="w-5 h-5" />}
                {index === 2 && <Target className="w-5 h-5" />}
                {index === 3 && <MessageSquare className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium text-center">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-3">
              {WIZARD_STEPS[currentStep].title}
            </h3>
            <p className="text-muted-foreground text-lg">
              {WIZARD_STEPS[currentStep].description}
            </p>
          </div>

          <div className="mt-8">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-12 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="w-32"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === WIZARD_STEPS.length - 1 || (currentStep === 0 && selectedPlatforms.size === 0)}
            className="w-32"
          >
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}