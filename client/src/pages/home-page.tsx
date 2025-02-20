import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as directus from "@/lib/directus";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Plus, Check, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
//import { KeywordTrendIndicator, KeywordTrend } from "@/components/keyword-trend";
import { AnimatedTrend } from "@/components/animated-trend";

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
});

type AddKeywordForm = z.infer<typeof addKeywordSchema>;

interface RelatedKeyword {
  phrase: string;
  number: string;
  isSelected?: boolean;
}

export default function HomePage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [previewKeyword, setPreviewKeyword] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [trendPredictions, setTrendPredictions] = useState<{ [key: string]: any }>({});

  const { data: keywords, isLoading } = useQuery({
    queryKey: ["/items/user_keywords"],
    queryFn: directus.getKeywords,
  });

  const addKeywordMutation = useMutation({
    mutationFn: directus.addKeyword,
    onSuccess: () => {
      form.reset();
      setPreviewData(null);
      setPreviewKeyword("");
      setSelectedKeywords(new Set());
      toast({ title: "Keywords added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/items/user_keywords"] });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: directus.deleteKeyword,
    onSuccess: () => {
      toast({ title: "Keyword deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/items/user_keywords"] });
    },
  });

  const predictTrendMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const wordstatData = await directus.getWordstatData(keyword);
      const trendPrediction = await directus.predictKeywordTrend(keyword, {
        shows: wordstatData.response.data.shows,
        sources: wordstatData.response.data.sources
      });
      setTrendPredictions(prev => ({
        ...prev,
        [keyword]: trendPrediction
      }));
      return { prediction: trendPrediction, historicalData: wordstatData.response.data.shows };
    },
    onSuccess: () => {
      toast({ title: "Trend prediction updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to predict trend",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const form = useForm<AddKeywordForm>({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: {
      keyword: "",
    },
  });

  const handlePreview = async (keyword: string) => {
    if (!keyword) return;

    setIsLoadingPreview(true);
    setPreviewKeyword(keyword);
    try {
      const data = await directus.getWordstatData(keyword);
      setPreviewData(data);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Error loading preview",
        description: "Failed to load WordStat data",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("keyword", value);
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const keyword = form.getValues("keyword");
      if (keyword) {
        await handlePreview(keyword);
      }
    }
  };

  const toggleKeyword = (phrase: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(phrase)) {
      newSelected.delete(phrase);
    } else {
      newSelected.add(phrase);
    }
    setSelectedKeywords(newSelected);
  };

  async function onSubmit() {
    try {
      for (const keyword of Array.from(selectedKeywords)) {
        try {
          await addKeywordMutation.mutateAsync(keyword);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('Session expired')) {
              return;
            }
            if (error.message.includes('already in your semantic core')) {
              toast({
                title: "Keyword exists",
                description: `"${keyword}" is already in your semantic core`,
                variant: "default"
              });
              continue;
            }
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('Error adding keywords:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add some keywords",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Keywords</h1>
        <Button variant="outline" onClick={logout}>
          Sign Out
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter keyword..."
                        {...field}
                        onChange={handleKeywordChange}
                        onKeyPress={handleKeyPress}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isLoadingPreview && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {previewData && previewKeyword === form.getValues("keyword") && (
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-muted-foreground mb-4">
                        <span>Average Shows: {Math.round(
                          previewData.response.data.shows
                            .slice(-3)
                            .reduce((sum: number, item: any) => sum + item.shows, 0) / 3
                        )}</span>
                        <span>Total Mentions: {previewData.response.data.sources?.reduce(
                          (sum: number, source: any) => sum + source.count,
                          0
                        )}</span>
                      </div>

                      <div className="space-y-2">
                        {previewData.content?.includingPhrases?.items?.map((item: RelatedKeyword, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-background rounded hover:bg-accent/5"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedKeywords.has(item.phrase)}
                                onCheckedChange={() => toggleKeyword(item.phrase)}
                              />
                              <span>{item.phrase}</span>
                            </div>
                            <span className="text-muted-foreground">{item.number}</span>
                          </div>
                        ))}
                      </div>

                      {selectedKeywords.size > 0 && (
                        <Button
                          type="submit"
                          className="w-full mt-4"
                          disabled={addKeywordMutation.isPending}
                        >
                          {addKeywordMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add {selectedKeywords.size} Keywords to Semantic Core
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {keywords?.map((keyword) => (
            <div key={keyword.id}>
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="font-medium">{keyword.keyword}</span>
                  <span className="text-sm text-muted-foreground">
                    {keyword.trend_score && `${Math.round(keyword.trend_score)} shows`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => predictTrendMutation.mutate(keyword.keyword)}
                    disabled={predictTrendMutation.isPending && predictTrendMutation.variables === keyword.keyword}
                  >
                    {predictTrendMutation.isPending && predictTrendMutation.variables === keyword.keyword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                    disabled={deleteKeywordMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {(trendPredictions[keyword.keyword] || keyword.trend_prediction) && (
                <div className="mt-2">
                  <AnimatedTrend
                    trend={trendPredictions[keyword.keyword] || keyword.trend_prediction!}
                    historicalData={previewData?.response?.data?.shows || []}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}