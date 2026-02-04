import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Search, UserPlus, Check, X, Trophy, Target, 
  Flame, Droplets, Footprints, Dumbbell, Crown, Medal,
  Plus, Calendar, ChevronLeft, Star, Zap, Heart, Award, Sparkles, Lock
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { User, Friendship, FriendChallenge, FriendChallengeParticipant } from "@shared/schema";

const challengeTypes = [
  { value: 'calories_burned', label: 'حرق السعرات', icon: Flame, color: 'from-orange-500 to-red-500' },
  { value: 'steps', label: 'الخطوات', icon: Footprints, color: 'from-blue-500 to-cyan-500' },
  { value: 'water', label: 'شرب الماء', icon: Droplets, color: 'from-cyan-400 to-blue-500' },
  { value: 'meals_logged', label: 'تسجيل الوجبات', icon: Target, color: 'from-green-500 to-emerald-500' },
];

const achievementBadges = [
  { id: "streak_3", icon: Flame, title: "بداية موفقة", requirement: 3, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  { id: "streak_7", icon: Star, title: "نجم الأسبوع", requirement: 7, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: "streak_14", icon: Zap, title: "محارب اللياقة", requirement: 14, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "streak_21", icon: Target, title: "عادة صحية", requirement: 21, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { id: "streak_30", icon: Medal, title: "بطل الشهر", requirement: 30, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  { id: "streak_60", icon: Award, title: "المثابر", requirement: 60, color: "text-pink-500", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  { id: "streak_90", icon: Heart, title: "عاشق الصحة", requirement: 90, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
  { id: "streak_180", icon: Crown, title: "الملك", requirement: 180, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "streak_365", icon: Sparkles, title: "الأسطورة", requirement: 365, color: "text-cyan-500", bgColor: "bg-gradient-to-r from-cyan-100 to-purple-100 dark:from-cyan-900/30 dark:to-purple-900/30" },
];

interface AchievementStats {
  currentStreak: number;
  totalPerfectDays: number;
}

export default function Friends() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<(FriendChallenge & { participants: (FriendChallengeParticipant & { user: User })[], creator: User }) | null>(null);

  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    type: "calories_burned",
    targetValue: 1000,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    participantIds: [] as string[]
  });

  const { data: profile, isLoading: profileLoading } = useQuery<User>({
    queryKey: ['/api/profile']
  });

  const { data: achievementStats } = useQuery<AchievementStats>({
    queryKey: ['/api/achievements/stats']
  });

  const { data: friends = [] } = useQuery<(Friendship & { friend: User })[]>({
    queryKey: ['/api/friends']
  });

  const { data: friendRequests = [] } = useQuery<(Friendship & { requester: User })[]>({
    queryKey: ['/api/friends/requests']
  });

  const { data: challenges = [] } = useQuery<(FriendChallenge & { participants: (FriendChallengeParticipant & { user: User })[], creator: User })[]>({
    queryKey: ['/api/friend-challenges']
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: searchQuery.length >= 2
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest('PUT', '/api/profile/username', { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: "تم تحديث اسم المستخدم بنجاح" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest('POST', '/api/friends/request', { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      setAddFriendUsername("");
      toast({ title: "تم إرسال طلب الصداقة" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: number; accept: boolean }) => {
      return apiRequest('POST', `/api/friends/respond/${requestId}`, { accept });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({ title: "تم تحديث طلب الصداقة" });
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      return apiRequest('DELETE', `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({ title: "تم إزالة الصديق" });
    }
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: typeof newChallenge) => {
      return apiRequest('POST', '/api/friend-challenges', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-challenges'] });
      setShowCreateChallenge(false);
      setNewChallenge({
        title: "",
        description: "",
        type: "calories_burned",
        targetValue: 1000,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        participantIds: []
      });
      toast({ title: "تم إنشاء التحدي بنجاح" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  });

  const needsUsername = !profile?.username;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">تحديات الأصدقاء</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {needsUsername ? (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                اختر اسم مستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                اختر اسم مستخدم فريد ليتمكن أصدقاؤك من إيجادك وإضافتك
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="اسم المستخدم (بالإنجليزية)"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="flex-1"
                  dir="ltr"
                  data-testid="input-username"
                />
                <Button 
                  onClick={() => updateUsernameMutation.mutate(usernameInput)}
                  disabled={!usernameInput || usernameInput.length < 3 || updateUsernameMutation.isPending}
                  data-testid="button-save-username"
                >
                  حفظ
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                يجب أن يكون 3 أحرف على الأقل، بالإنجليزية والأرقام فقط
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile?.profileImageUrl || ''} />
                      <AvatarFallback>{profile?.firstName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile?.firstName} {profile?.lastName}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">@{profile?.username}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="w-3 h-3" />
                    {profile?.totalPoints || 0} نقطة
                  </Badge>
                </div>
                
                {/* Achievement Badges */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      شارات الإنجازات
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>{achievementStats?.currentStreak || 0} يوم متتالي</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {achievementBadges.map((badge) => {
                      const isUnlocked = (achievementStats?.currentStreak || 0) >= badge.requirement;
                      const BadgeIcon = badge.icon;
                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`relative group`}
                          title={`${badge.title} - ${badge.requirement} يوم`}
                        >
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all
                            ${isUnlocked ? badge.bgColor : 'bg-muted'}
                            ${isUnlocked ? 'ring-2 ring-offset-2 ring-primary/20' : ''}
                          `}>
                            {isUnlocked ? (
                              <BadgeIcon className={`w-5 h-5 ${badge.color}`} />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded px-1 py-0.5 text-[10px] whitespace-nowrap z-10 shadow-sm">
                            {badge.title}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {achievementBadges.filter(b => (achievementStats?.currentStreak || 0) >= b.requirement).length} من {achievementBadges.length} شارة مفتوحة
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="friends" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="friends" className="gap-1" data-testid="tab-friends">
                  <Users className="w-4 h-4" />
                  الأصدقاء
                  {friends.length > 0 && <Badge variant="secondary" className="ms-1 h-5 px-1.5">{friends.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-1" data-testid="tab-requests">
                  <UserPlus className="w-4 h-4" />
                  الطلبات
                  {friendRequests.length > 0 && <Badge className="ms-1 h-5 px-1.5">{friendRequests.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="challenges" className="gap-1" data-testid="tab-challenges">
                  <Trophy className="w-4 h-4" />
                  التحديات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="أضف صديق باسم المستخدم"
                        value={addFriendUsername}
                        onChange={(e) => setAddFriendUsername(e.target.value)}
                        dir="ltr"
                        data-testid="input-add-friend"
                      />
                      <Button 
                        onClick={() => sendFriendRequestMutation.mutate(addFriendUsername)}
                        disabled={!addFriendUsername || sendFriendRequestMutation.isPending}
                        data-testid="button-send-request"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {friends.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">لا يوجد أصدقاء حتى الآن</p>
                      <p className="text-sm text-muted-foreground mt-1">أضف أصدقاء للتنافس معهم!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {friends.map((f) => (
                      <Card key={f.id} className="hover-elevate" data-testid={`friend-card-${f.friend.id}`}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={f.friend.profileImageUrl || ''} />
                                <AvatarFallback>{f.friend.firstName?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{f.friend.firstName} {f.friend.lastName}</p>
                                <p className="text-xs text-muted-foreground" dir="ltr">@{f.friend.username}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeFriendMutation.mutate(f.friend.id)}
                              data-testid={`button-remove-friend-${f.friend.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="requests" className="space-y-4 mt-4">
                {friendRequests.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">لا توجد طلبات صداقة</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {friendRequests.map((r) => (
                      <Card key={r.id} data-testid={`request-card-${r.id}`}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={r.requester.profileImageUrl || ''} />
                                <AvatarFallback>{r.requester.firstName?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{r.requester.firstName} {r.requester.lastName}</p>
                                <p className="text-xs text-muted-foreground" dir="ltr">@{r.requester.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => respondToRequestMutation.mutate({ requestId: r.id, accept: true })}
                                data-testid={`button-accept-${r.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => respondToRequestMutation.mutate({ requestId: r.id, accept: false })}
                                data-testid={`button-reject-${r.id}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="challenges" className="space-y-4 mt-4">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setShowCreateChallenge(true)}
                  disabled={friends.length === 0}
                  data-testid="button-create-challenge"
                >
                  <Plus className="w-4 h-4" />
                  إنشاء تحدي جديد
                </Button>

                {friends.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground">
                    أضف أصدقاء أولاً لإنشاء تحديات معهم
                  </p>
                )}

                {challenges.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">لا توجد تحديات حالية</p>
                      <p className="text-sm text-muted-foreground mt-1">أنشئ تحدي جديد مع أصدقائك!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((challenge) => {
                      const typeInfo = challengeTypes.find(t => t.value === challenge.type);
                      const Icon = typeInfo?.icon || Target;
                      const isActive = new Date(challenge.endDate) > new Date();
                      
                      return (
                        <motion.div
                          key={challenge.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card 
                            className="hover-elevate cursor-pointer"
                            onClick={() => setSelectedChallenge(challenge)}
                            data-testid={`challenge-card-${challenge.id}`}
                          >
                            <CardContent className="py-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo?.color} flex items-center justify-center`}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{challenge.title}</h3>
                                    <Badge variant={isActive ? "default" : "secondary"}>
                                      {isActive ? "نشط" : "منتهي"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    الهدف: {challenge.targetValue.toLocaleString('ar-SA')} {typeInfo?.label}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex -space-x-2 space-x-reverse">
                                      {challenge.participants.slice(0, 4).map((p) => (
                                        <Avatar key={p.userId} className="w-6 h-6 border-2 border-background">
                                          <AvatarImage src={p.user.profileImageUrl || ''} />
                                          <AvatarFallback className="text-xs">{p.user.firstName?.[0]}</AvatarFallback>
                                        </Avatar>
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {challenge.participants.length} مشاركين
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء تحدي جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>عنوان التحدي</Label>
              <Input
                value={newChallenge.title}
                onChange={(e) => setNewChallenge(p => ({ ...p, title: e.target.value }))}
                placeholder="مثال: تحدي الخطوات الأسبوعي"
                data-testid="input-challenge-title"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع التحدي</Label>
              <Select
                value={newChallenge.type}
                onValueChange={(v) => setNewChallenge(p => ({ ...p, type: v }))}
              >
                <SelectTrigger data-testid="select-challenge-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {challengeTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القيمة المستهدفة</Label>
              <Input
                type="number"
                value={newChallenge.targetValue}
                onChange={(e) => setNewChallenge(p => ({ ...p, targetValue: parseInt(e.target.value) || 0 }))}
                data-testid="input-challenge-target"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={newChallenge.startDate}
                  onChange={(e) => setNewChallenge(p => ({ ...p, startDate: e.target.value }))}
                  data-testid="input-challenge-start"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={newChallenge.endDate}
                  onChange={(e) => setNewChallenge(p => ({ ...p, endDate: e.target.value }))}
                  data-testid="input-challenge-end"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>اختر الأصدقاء للتحدي</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {friends.map((f) => (
                  <label 
                    key={f.friend.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newChallenge.participantIds.includes(f.friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewChallenge(p => ({ ...p, participantIds: [...p.participantIds, f.friend.id] }));
                        } else {
                          setNewChallenge(p => ({ ...p, participantIds: p.participantIds.filter(id => id !== f.friend.id) }));
                        }
                      }}
                      className="rounded"
                      data-testid={`checkbox-friend-${f.friend.id}`}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={f.friend.profileImageUrl || ''} />
                      <AvatarFallback>{f.friend.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                    <span>{f.friend.firstName} {f.friend.lastName}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => createChallengeMutation.mutate(newChallenge)}
              disabled={!newChallenge.title || createChallengeMutation.isPending}
              data-testid="button-submit-challenge"
            >
              إنشاء التحدي
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              لوحة الصدارة
            </DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4 py-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">{selectedChallenge.title}</h3>
                <p className="text-sm text-muted-foreground">
                  الهدف: {selectedChallenge.targetValue.toLocaleString('ar-SA')}
                </p>
              </div>
              <div className="space-y-2">
                {selectedChallenge.participants.map((p, index) => {
                  const progress = Math.min(100, (p.currentValue / selectedChallenge.targetValue) * 100);
                  return (
                    <div 
                      key={p.userId} 
                      className={`flex items-center gap-3 p-3 rounded-xl ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800' : 'bg-muted/50'}`}
                      data-testid={`leaderboard-item-${p.userId}`}
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        {index === 0 ? (
                          <Crown className="w-6 h-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="w-5 h-5 text-gray-400" />
                        ) : index === 2 ? (
                          <Medal className="w-5 h-5 text-amber-600" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={p.user.profileImageUrl || ''} />
                        <AvatarFallback>{p.user.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{p.user.firstName} {p.user.lastName}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{p.currentValue.toLocaleString('ar-SA')}</p>
                        {p.completed && (
                          <Badge variant="default" className="mt-1">
                            <Check className="w-3 h-3 me-1" />
                            مكتمل
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
