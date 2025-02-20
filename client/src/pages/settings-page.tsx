import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchSettingsSchema, type SearchSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as directus from "@/lib/directus";

const socialNetworks = [
  { id: 'vkontakte', label: 'ВКонтакте' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'rutube', label: 'RuTube' }
];

const searchEngines = [
  { id: 'google', label: 'Google' },
  { id: 'yandex', label: 'Яндекс' },
  { id: 'bing', label: 'Bing' }
];

const contentTypes = [
  { id: 'posts', label: 'Посты' },
  { id: 'comments', label: 'Комментарии' },
  { id: 'articles', label: 'Статьи' },
  { id: 'videos', label: 'Видео' }
];

const dateRanges = [
  { value: 'day', label: 'За день' },
  { value: 'week', label: 'За неделю' },
  { value: 'month', label: 'За месяц' },
  { value: 'year', label: 'За год' }
];

export default function SettingsPage() {
  const { toast } = useToast();
  const userId = localStorage.getItem('user_id');

  const form = useForm<SearchSettings>({
    resolver: zodResolver(searchSettingsSchema),
    defaultValues: {
      user_id: userId || '',
      social_networks: [],
      search_engines: [],
      content_types: [],
      date_range: 'month'
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: directus.saveSearchSettings,
    onSuccess: () => {
      toast({
        title: "Настройки сохранены",
        description: "Ваши настройки поиска успешно обновлены"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  async function onSubmit(data: SearchSettings) {
    try {
      await saveSettingsMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Настройки поиска</h1>

      <Card>
        <CardHeader>
          <CardTitle>Параметры поиска контента</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="social_networks"
                render={() => (
                  <FormItem>
                    <FormLabel>Социальные сети</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {socialNetworks.map((network) => (
                        <FormField
                          key={network.id}
                          control={form.control}
                          name="social_networks"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={network.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(network.id as any)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, network.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== network.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {network.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="search_engines"
                render={() => (
                  <FormItem>
                    <FormLabel>Поисковые системы</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {searchEngines.map((engine) => (
                        <FormField
                          key={engine.id}
                          control={form.control}
                          name="search_engines"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={engine.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(engine.id as any)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, engine.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== engine.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {engine.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_types"
                render={() => (
                  <FormItem>
                    <FormLabel>Типы контента</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {contentTypes.map((type) => (
                        <FormField
                          key={type.id}
                          control={form.control}
                          name="content_types"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={type.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type.id as any)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, type.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== type.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {type.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период поиска</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите период" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dateRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={saveSettingsMutation.isPending}
              >
                Сохранить настройки
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
