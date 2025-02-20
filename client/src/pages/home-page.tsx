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
import { Loader2, Trash2, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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
    handlePreview(value);
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
      // Add all selected keywords
      for (const keyword of Array.from(selectedKeywords)) {  // Convert Set to Array for iteration
        try {
          await addKeywordMutation.mutateAsync(keyword);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Session expired')) {
            // Session expired error will be handled by the axios interceptor
            // which will redirect to the auth page
            return;
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
        <div className="space-y-2">
          {keywords?.map((keyword) => (
            <div
              key={keyword.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="font-medium">{keyword.keyword}</span>
                <span className="text-sm text-muted-foreground">
                  {keyword.trend_score && `${Math.round(keyword.trend_score)} shows`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                disabled={deleteKeywordMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}