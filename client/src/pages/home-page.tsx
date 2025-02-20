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
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
});

type AddKeywordForm = z.infer<typeof addKeywordSchema>;

export default function HomePage() {
  const { logout } = useAuth();
  const { toast } = useToast();

  const { data: keywords, isLoading } = useQuery({
    queryKey: ["/items/user_keywords"],
    queryFn: directus.getKeywords,
  });

  const addKeywordMutation = useMutation({
    mutationFn: directus.addKeyword,
    onSuccess: () => {
      form.reset();
      toast({ title: "Keyword added successfully" });
      // Инвалидируем кэш после успешного добавления
      queryClient.invalidateQueries({ queryKey: ["/items/user_keywords"] });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: directus.deleteKeyword,
    onSuccess: () => {
      toast({ title: "Keyword deleted successfully" });
      // Инвалидируем кэш после успешного удаления
      queryClient.invalidateQueries({ queryKey: ["/items/user_keywords"] });
    },
  });

  const form = useForm<AddKeywordForm>({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: {
      keyword: "",
    },
  });

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Enter keyword..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={addKeywordMutation.isPending}
              >
                {addKeywordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
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