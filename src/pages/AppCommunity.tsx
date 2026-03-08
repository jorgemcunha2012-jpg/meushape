import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Calendar, Users, Heart, Send, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SubscriptionGate from "@/components/SubscriptionGate";

interface Post {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: { name: string } | null;
  liked_by_me: boolean;
}

const AppCommunity = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/app/login");
      return;
    }
    if (user) fetchPosts();
  }, [user, loading]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("id, content, likes_count, created_at, user_id, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setPosts(data as any);
    }

    // Fetch my likes
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      if (likes) {
        setMyLikes(new Set(likes.map((l) => l.post_id)));
      }
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);

    const { error } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, content: newPost.trim() });

    if (error) {
      toast.error("Erro ao publicar");
    } else {
      setNewPost("");
      fetchPosts();
      toast.success("Publicado! 🎉");
    }
    setPosting(false);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const liked = myLikes.has(postId);

    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      setMyLikes((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      // Update local count
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p))
      );
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });
      setMyLikes((prev) => new Set(prev).add(postId));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
      );
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-bold text-foreground">Comunidade</h1>
          <p className="text-sm text-muted-foreground">Mulheres treinando juntas 💪</p>
        </div>
      </header>

      {/* New Post */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-4">
          <Textarea
            placeholder="Compartilhe como foi seu treino hoje..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="border-0 resize-none focus-visible:ring-0 p-0 text-sm min-h-[60px]"
          />
          <div className="flex justify-end mt-3">
            <Button
              size="sm"
              onClick={handlePost}
              disabled={!newPost.trim() || posting}
              className="rounded-full"
            >
              <Send className="w-4 h-4 mr-1" />
              Publicar
            </Button>
          </div>
        </div>
      </section>

      {/* Posts Feed */}
      <section className="px-4">
        <div className="max-w-lg mx-auto space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Nenhuma publicação ainda</p>
              <p className="text-sm text-muted-foreground">
                Seja a primeira a compartilhar! 🌟
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">
                      {((post.profiles as any)?.name || "?")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {(post.profiles as any)?.name || "Anônima"}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-3">{post.content}</p>
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1 text-sm ${
                    myLikes.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${myLikes.has(post.id) ? "fill-current" : ""}`} />
                  <span>{post.likes_count}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-3">
          <button onClick={() => navigate("/app")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Dumbbell className="w-5 h-5" />
            <span className="text-xs">Treinos</span>
          </button>
          <button onClick={() => navigate("/app/history")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Histórico</span>
          </button>
          <button onClick={() => navigate("/app/community")} className="flex flex-col items-center gap-1 text-primary">
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Comunidade</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppCommunity;
