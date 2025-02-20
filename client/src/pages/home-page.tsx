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
import { Loader2, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
});

type AddKeywordForm = z.infer<typeof addKeywordSchema>;

export default function HomePage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [previewKeyword, setPreviewKeyword] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

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
      toast({ title: "Keyword added successfully" });
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

  async function onSubmit(data: AddKeywordForm) {
    await addKeywordMutation.mutateAsync(data.keyword);
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
          <CardTitle>Add New Keyword</CardTitle>
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
                      <div>
                        <span className="font-medium">Average Shows: </span>
                        {Math.round(
                          previewData.response.data.shows
                            .slice(-3)
                            .reduce((sum: number, item: any) => sum + item.shows, 0) / 3
                        )}
                      </div>
                      {previewData.response.data.sources && (
                        <div>
                          <span className="font-medium">Total Mentions: </span>
                          {previewData.response.data.sources.reduce(
                            (sum: number, source: any) => sum + source.count,
                            0
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Related Keywords:</h3>
                        <div className="max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            {previewData.content?.includingPhrases?.items?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-background rounded">
                                <span>{item.phrase}</span>
                                <span className="text-muted-foreground">{item.number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

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
                            Add to Semantic Core
                          </>
                        )}
                      </Button>
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
        <div className="grid gap-4">
          {keywords?.map((keyword) => (
            <div
              key={keyword.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border"
            >
              <div className="flex flex-col">
                <span className="font-medium">{keyword.keyword}</span>
                <div className="text-sm text-muted-foreground mt-1">
                  {keyword.trend_score && (
                    <span className="mr-4">Показы: {Math.round(keyword.trend_score)}</span>
                  )}
                  {keyword.mentions_count !== undefined && (
                    <span>Упоминания: {keyword.mentions_count}</span>
                  )}
                </div>
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