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
import { Loader2, Trash2, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { AnimatedTrend } from "@/components/animated-trend";

const addCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
});

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  campaign_id: z.string().min(1, "Campaign is required"),
});

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [trendPredictions, setTrendPredictions] = useState({});

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: directus.getCampaigns,
  });

  const keywordsQuery = useQuery({
    queryKey: ["keywords", selectedCampaign],
    queryFn: () => directus.getKeywords(selectedCampaign),
    enabled: !!selectedCampaign,
  });

  const addCampaignMutation = useMutation({
    mutationFn: directus.addCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setSelectedCampaign(data.id);
      campaignForm.reset();
      toast({ title: "Campaign added" });
      
      // Switch to keywords tab after campaign creation
      const keywordsTab = document.querySelector('[value="keywords"]') as HTMLElement;
      if (keywordsTab) {
        keywordsTab.click();
      }
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: directus.addKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", selectedCampaign] });
      keywordForm.reset();
      toast({ title: "Keyword added" });
    },
  });

  const campaignForm = useForm({
    resolver: zodResolver(addCampaignSchema),
    defaultValues: { name: "", description: "" },
  });

  const keywordForm = useForm({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: { keyword: "", campaign_id: "" },
  });

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Tabs defaultValue="campaigns">
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
                <form onSubmit={campaignForm.handleSubmit((data) => addCampaignMutation.mutate(data))} className="space-y-4">
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
                    {addCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Campaign
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {campaignsQuery.data?.map((campaign) => (
            <Card key={campaign.id} className="mt-4">
              <CardHeader>
                <CardTitle>{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{campaign.description}</p>
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    setSelectedCampaign(campaign.id);
                    const keywordsTab = document.querySelector('[value="keywords"]') as HTMLElement;
                    if (keywordsTab) {
                      keywordsTab.click();
                      // Force keyword query refetch
                      keywordsQuery.refetch();
                    }
                  }}
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
                <p className="text-center text-muted-foreground">Please select a campaign first</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Campaign:</p>
                    <p className="text-lg font-medium">{campaignsQuery.data?.find(c => c.id === selectedCampaign)?.name}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedCampaign("")}>
                    Change Campaign
                  </Button>
                </CardContent>
              </Card>
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Add Keyword</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...keywordForm}>
                    <form onSubmit={keywordForm.handleSubmit(async (data) => {
                      try {
                        const wordstatData = await directus.getWordstatData(data.keyword);
                        if (wordstatData?.response?.data?.shows) {
                          const suggestions = wordstatData.response.data.shows
                            .map((item, index) => ({
                              keyword: `${data.keyword} ${index + 1}`,
                              shows: item.shows
                            }))
                            .filter(item => item.shows > 0)
                            .slice(0, 10);
                          
                          // Add original keyword first
                          addKeywordMutation.mutate({ 
                            keyword: data.keyword,
                            campaign_id: selectedCampaign 
                          });
                          
                          // Add suggested keywords
                          suggestions.forEach(suggestion => {
                            addKeywordMutation.mutate({
                              keyword: suggestion.keyword,
                              campaign_id: selectedCampaign
                            });
                          });
                        }
                      } catch (error) {
                        console.error('WordStat error:', error);
                      }
                    })} className="space-y-4">
                      <FormField
                        control={keywordForm.control}
                        name="keyword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Enter keyword" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={addKeywordMutation.isPending}>
                        {addKeywordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Add Keyword with Suggestions
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          )}

          {keywordsQuery.data?.map((keyword) => (
            <Card key={keyword.id} className="mt-4">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{keyword.keyword}</h3>
                  <Button variant="ghost" size="icon" onClick={() => directus.deleteKeyword(keyword.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {(trendPredictions[keyword.keyword] || keyword.trend_prediction) && (
                  <div className="mt-2">
                    <AnimatedTrend
                      trend={trendPredictions[keyword.keyword]?.prediction || keyword.trend_prediction}
                      historicalData={trendPredictions[keyword.keyword]?.historicalData || []}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}