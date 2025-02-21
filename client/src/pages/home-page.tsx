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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Campaign, Keyword } from "@shared/schema";

const addCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
});

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
});

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [activeTab, setActiveTab] = useState("campaigns");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Query campaigns
  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: directus.getCampaigns,
  });

  // Query keywords for selected campaign
  const keywordsQuery = useQuery({
    queryKey: ["keywords", selectedCampaign],
    queryFn: () => directus.getKeywords(selectedCampaign),
    enabled: !!selectedCampaign,
  });

  // Query WordStat suggestions with error handling
  const wordstatQuery = useQuery({
    queryKey: ["wordstat", searchTerm],
    queryFn: () => directus.getWordstatData(searchTerm),
    enabled: searchTerm.length > 2,
    retry: false,
  });

  // Add campaign mutation
  const addCampaignMutation = useMutation({
    mutationFn: directus.addCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setSelectedCampaign(data.id);
      campaignForm.reset();
      toast({ title: "Campaign added" });
      setActiveTab("keywords");
    },
  });

  // Add keyword mutation
  const addKeywordMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      if (!selectedCampaign) {
        throw new Error("Please select a campaign first");
      }
      // Add keywords one by one
      const results = await Promise.all(
        keywords.map((keyword) => directus.addKeyword(keyword, selectedCampaign))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", selectedCampaign] });
      setSelectedKeywords(new Set());
      setSearchTerm("");
      toast({ title: "Keywords added" });
    },
  });

  const campaignForm = useForm({
    resolver: zodResolver(addCampaignSchema),
    defaultValues: { name: "", description: "" },
  });

  const keywordForm = useForm({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: { keyword: "" },
  });

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setActiveTab("keywords");
  };

  // Delete keyword mutation
  const deleteKeywordMutation = useMutation({
    mutationFn: directus.deleteKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", selectedCampaign] });
      toast({ title: "Keyword deleted" });
    },
  });

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  const handleAddSelectedKeywords = () => {
    if (selectedKeywords.size === 0) {
      toast({ title: "Please select keywords to add", variant: "destructive" });
      return;
    }
    addKeywordMutation.mutate(Array.from(selectedKeywords));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Add Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...campaignForm}>
                <form
                  onSubmit={campaignForm.handleSubmit((data) =>
                    addCampaignMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={campaignForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Campaign name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={campaignForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Campaign description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={addCampaignMutation.isPending}>
                    {addCampaignMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Campaign
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {campaignsQuery.data?.map((campaign: Campaign) => (
            <Card key={campaign.id} className="mt-4">
              <CardHeader>
                <CardTitle>{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{campaign.description}</p>
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() => handleCampaignSelect(campaign.id)}
                >
                  View Keywords
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="keywords">
          {!selectedCampaign ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Please select a campaign first
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Campaign:
                    </p>
                    <p className="text-lg font-medium">
                      {campaignsQuery.data?.find(
                        (c: Campaign) => c.id === selectedCampaign
                      )?.name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCampaign("");
                      setActiveTab("campaigns");
                    }}
                  >
                    Change Campaign
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Input
                      placeholder="Search keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddSelectedKeywords}
                      disabled={selectedKeywords.size === 0 || addKeywordMutation.isPending}
                    >
                      {addKeywordMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Selected ({selectedKeywords.size})
                    </Button>
                  </div>

                  {wordstatQuery.isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : wordstatQuery.isError ? (
                    <div className="text-center text-destructive py-4">
                      {wordstatQuery.error?.message || "Failed to load suggestions"}
                    </div>
                  ) : wordstatQuery.data?.response?.data?.shows ? (
                    <div className="space-y-2">
                      {wordstatQuery.data.response.data.shows.map(
                        (item: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4 p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              checked={selectedKeywords.has(item.phrase)}
                              onCheckedChange={() =>
                                handleKeywordSelect(item.phrase)
                              }
                            />
                            <span className="flex-1">{item.phrase}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Intl.NumberFormat("ru-RU").format(
                                item.shows
                              )}{" "}
                              shows/month
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : searchTerm.length > 2 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No suggestions found
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold">Current Keywords</h3>
                {keywordsQuery.data?.map((keyword: Keyword) => (
                  <Card key={keyword.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          {keyword.keyword}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            Trend: {keyword.trend_score || "N/A"}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {keyword.mentions_count && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Mentions: {keyword.mentions_count}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}