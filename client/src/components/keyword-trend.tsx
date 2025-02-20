import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { KeywordTrend } from "@shared/schema";

interface KeywordTrendProps {
  trend: KeywordTrend;
  isLoading?: boolean;
}

export function KeywordTrendIndicator({ trend, isLoading = false }: KeywordTrendProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Анализ тренда...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  }[trend.trend_direction];

  const trendDescription = {
    up: "Растущий тренд",
    down: "Падающий тренд",
    stable: "Стабильный тренд"
  }[trend.trend_direction];

  const trendColor = {
    up: "text-green-500",
    down: "text-red-500",
    stable: "text-yellow-500"
  }[trend.trend_direction];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendIcon className={`h-5 w-5 ${trendColor}`} />
          {trendDescription}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Потенциал роста</span>
            <span>{trend.growth_potential}%</span>
          </div>
          <Progress value={trend.growth_potential} />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Уверенность прогноза</span>
            <span>{Math.round(trend.confidence_score * 100)}%</span>
          </div>
          <Progress value={trend.confidence_score * 100} />
        </div>

        {trend.seasonality.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Сезонность:</h4>
            <div className="flex flex-wrap gap-2">
              {trend.seasonality.map((season, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                >
                  {season}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2">
          Дата прогноза: {new Date(trend.prediction_date).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}