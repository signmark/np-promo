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
import { Loader2, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState, useCallback } from "react";
import { AnimatedTrend } from "@/components/animated-trend";
import { NavigationProgress } from "@/components/ui/navigation-progress";

const addCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
});

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
});

const TOTAL_STEPS = 2; // Campaigns and Keywords tabs

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [activeTab, setActiveTab] = useState("campaigns");
  const [trendPredictions, setTrendPredictions] = useState<Record<string, any>>({});

  const getCurrentStep = () => {
    return activeTab === "campaigns" ? 0 : 1;
  };

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: directus.getCampaigns,
    staleTime: 1000 * 60, // 1 minute
    retry: 3,
    enabled: !!user
  });

  const keywordsQuery = useQuery({
    queryKey: ["keywords", selectedCampaign],
    queryFn: () => directus.getKeywords(selectedCampaign),
    staleTime: 1000 * 60,
    retry: 3,
    enabled: !!selectedCampaign && !!user
  });

  const addCampaignMutation = useMutation({
    mutationFn: directus.addCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setSelectedCampaign(data.id);
      campaignForm.reset();
      toast({ title: "Campaign added" });
      setActiveTab("keywords");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add campaign", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: directus.deleteKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", selectedCampaign] });
      toast({ title: "Keyword deleted" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete keyword", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (data: { keyword: string }) => {
      if (!selectedCampaign) {
        throw new Error("Please select a campaign first");
      }
      return directus.addKeyword(data.keyword);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", selectedCampaign] });
      keywordForm.reset();
      toast({ title: "Keyword added" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add keyword", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const campaignForm = useForm({
    resolver: zodResolver(addCampaignSchema),
    defaultValues: { name: "", description: "" },
  });

  const keywordForm = useForm({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: { keyword: "" },
  });

  const handleCampaignSelect = useCallback((campaignId: string) => {
    setSelectedCampaign(campaignId);
    setActiveTab("keywords");
  }, []);

  const handleDeleteKeyword = useCallback(async (keywordId: string) => {
    try {
      await deleteKeywordMutation.mutateAsync(keywordId);
    } catch (error) {
      console.error('Failed to delete keyword:', error);
    }
  }, [deleteKeywordMutation]);

  // Wait for user data to be loaded
  if (!user) {
    return null;
  }

  // Show loading state while fetching initial data
  if (campaignsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <NavigationProgress
        currentStep={getCurrentStep()}
        totalSteps={TOTAL_STEPS}
      />
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    campaignForm.handleSubmit((data) => addCampaignMutation.mutate(data))(e);
                  }}
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

          {campaignsQuery.data?.map((campaign: any) => (
            <Card key={campaign.id} className="mt-4">
              <CardHeader>
                <CardTitle>{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{campaign.description}</p>
                <Button
                  type="button"
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
                      {
                        campaignsQuery.data?.find(
                          (c: any) => c.id === selectedCampaign
                        )?.name
                      }
                    </p>
                  </div>
                  <Button
                    type="button"
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
                  <CardTitle>Add Keyword</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...keywordForm}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        keywordForm.handleSubmit((data) => addKeywordMutation.mutate(data))(e);
                      }}
                      className="space-y-4"
                    >
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
                        {addKeywordMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Keyword
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {keywordsQuery.isLoading ? (
                <div className="flex justify-center mt-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                keywordsQuery.data?.map((keyword: any) => (
                  <Card key={keyword.id} className="mt-4">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          {keyword.keyword}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteKeyword(keyword.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {(trendPredictions[keyword.keyword] ||
                        keyword.trend_prediction) && (
                        <div className="mt-2">
                          <AnimatedTrend
                            trend={
                              trendPredictions[keyword.keyword]?.prediction ||
                              keyword.trend_prediction
                            }
                            historicalData={
                              trendPredictions[keyword.keyword]?.historicalData || []
                            }
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}