import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, MessageCircle, Loader2 } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
  const { user, loading, subscribed, subscriptionLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user && !isAdmin) {
      navigate("/app/login");
      return;
    }
    if ((user && subscribed) || isAdmin) fetchPosts();
  }, [user, loading, subscribed, isAdmin]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("id, content, likes_count, created_at, user_id, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setPosts(data as any);

    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      if (likes) setMyLikes(new Set(likes.map((l) => l.post_id)));
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || (!user && !isAdmin)) return;
    if (isAdmin) {
      toast.error("Admins não podem postar na comunidade");
      return;
    }
    setPosting(true);
    const { error } = await supabase
      .from("community_posts")
      .insert({ user_id: user!.id, content: newPost.trim() });

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
    if (!user || isAdmin) return;
    const liked = myLikes.has(postId);
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setMyLikes(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      setMyLikes(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading || subscriptionLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <SolarPage>
      <SolarHeader title="Comunidade" showBack />

      {/* New Post */}
      <section className="px-5 py-4">
        <div 
          className="max-w-lg mx-auto rounded-2xl p-4"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <Textarea
            placeholder="Compartilhe como foi seu treino hoje..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="border-0 resize-none focus-visible:ring-0 p-0 text-sm min-h-[60px] bg-transparent"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handlePost}
              disabled={!newPost.trim() || posting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-40"
              style={{
                background: "hsl(var(--primary))",
                boxShadow: "0 4px 16px hsla(350 85% 60% / 0.3)",
              }}
            >
              {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publicar
            </button>
          </div>
        </div>
      </section>

      {/* Posts Feed */}
      <section className="px-5">
        <div className="max-w-lg mx-auto space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">💬</span>
              <p className="text-foreground font-semibold mb-1">Nenhuma publicação ainda</p>
              <p className="text-sm text-muted-foreground">Seja a primeira a compartilhar! 🌟</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(233,69,96,0.15)", color: "hsl(var(--primary))" }}
                  >
                    {((post.profiles as any)?.name || "?")[0]?.toUpperCase()}
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
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: myLikes.has(post.id) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                >
                  <Heart className="w-4 h-4" style={{ fill: myLikes.has(post.id) ? "hsl(var(--primary))" : "transparent" }} />
                  <span className="text-xs font-medium">{post.likes_count}</span>
                </button>
              </motion.div>
            ))
          )}
        </div>
      </section>

    </SolarPage>
  );
};

export default AppCommunity;
