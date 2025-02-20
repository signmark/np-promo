import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KeywordTrend } from "@shared/schema";

interface Point {
  x: number;
  y: number;
}

interface AnimatedTrendProps {
  trend: KeywordTrend;
  historicalData: Array<{ shows: number }>;
}

export function AnimatedTrend({ trend, historicalData }: AnimatedTrendProps) {
  // Convert historical data to points
  const points = historicalData.map((data, index) => ({
    x: index * 50,
    y: 100 - (data.shows / Math.max(...historicalData.map(d => d.shows)) * 100)
  }));

  // Create SVG path from points
  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  }[trend.trend_direction];

  const trendColor = {
    up: "text-green-500",
    down: "text-red-500",
    stable: "text-yellow-500"
  }[trend.trend_direction];

  const trendDescription = {
    up: "Растущий тренд",
    down: "Падающий тренд",
    stable: "Стабильный тренд"
  }[trend.trend_direction];

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {trendDescription}
          </motion.span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Historical trend graph */}
        <div className="h-32 relative">
          <svg className="w-full h-full" viewBox="0 0 250 100" preserveAspectRatio="none">
            <motion.path
              d={linePath}
              stroke={trend.trend_direction === 'up' ? "#22c55e" : 
                      trend.trend_direction === 'down' ? "#ef4444" : "#eab308"}
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Animated progress bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Потенциал роста</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {trend.growth_potential}%
              </motion.span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${trend.growth_potential}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Уверенность прогноза</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {Math.round(trend.confidence_score * 100)}%
              </motion.span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${trend.confidence_score * 100}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </div>
        </div>

        {/* Seasonality tags */}
        {trend.seasonality.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Сезонность:</h4>
            <div className="flex flex-wrap gap-2">
              {trend.seasonality.map((season, index) => (
                <motion.span
                  key={index}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  {season}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        <motion.div 
          className="text-xs text-muted-foreground mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Дата прогноза: {new Date(trend.prediction_date).toLocaleDateString()}
        </motion.div>
      </CardContent>
    </Card>
  );
}
