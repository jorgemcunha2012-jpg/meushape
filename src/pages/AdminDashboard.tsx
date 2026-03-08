import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LogOut, Users, Eye, CreditCard, Camera, RefreshCw, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  email: string;
  created_at: string;
  opted_in: boolean;
  quiz_answers: Record<string, unknown>;
  profile_scores: Record<string, unknown>;
}

interface BodyAnalysis {
  id: string;
  email: string;
  created_at: string;
  analysis_result: Record<string, unknown> | null;
  model_used: string | null;
}

interface CheckoutEvent {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [visitCount, setVisitCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [checkoutCount, setCheckoutCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [analyses, setAnalyses] = useState<BodyAnalysis[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutEvent[]>([]);

  const [todayVisits, setTodayVisits] = useState(0);
  const [todayLeads, setTodayLeads] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      setLoading(false);
      fetchAll();
    };
    checkAuth();
  }, [navigate]);

  const fetchAll = async () => {
    setRefreshing(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [visitsRes, leadsRes, checkoutsRes, analysesRes, todayVisitsRes, todayLeadsRes] =
      await Promise.all([
        supabase.from("funnel_visits").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("checkout_events").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("body_analyses").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("funnel_visits").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
      ]);

    setVisitCount(visitsRes.count ?? 0);
    setLeadCount(leadsRes.data?.length ?? 0);
    setCheckoutCount(checkoutsRes.data?.length ?? 0);
    setAnalysisCount(analysesRes.data?.length ?? 0);
    setTodayVisits(todayVisitsRes.count ?? 0);
    setTodayLeads(todayLeadsRes.count ?? 0);

    setLeads((leadsRes.data as Lead[]) ?? []);
    setCheckouts((checkoutsRes.data as CheckoutEvent[]) ?? []);
    setAnalyses((analysesRes.data as BodyAnalysis[]) ?? []);

    setRefreshing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const conversionRate = leadCount > 0 ? ((checkoutCount / leadCount) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Painel Admin</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { title: "Visitas", value: visitCount, icon: Eye, sub: `${todayVisits} hoje` },
            { title: "Leads", value: leadCount, icon: Users, sub: `${todayLeads} hoje` },
            { title: "Checkouts", value: checkoutCount, icon: CreditCard, sub: "Iniciados" },
            { title: "Análises", value: analysisCount, icon: Camera, sub: "Fotos analisadas" },
            { title: "Conversão", value: `${conversionRate}%`, icon: TrendingUp, sub: "Lead → Checkout" },
          ].map(({ title, value, icon: Icon, sub }) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-display">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads">Leads ({leadCount})</TabsTrigger>
            <TabsTrigger value="analyses">Análises ({analysisCount})</TabsTrigger>
            <TabsTrigger value="checkouts">Checkouts ({checkoutCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardContent className="pt-6">
                {leads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhum lead capturado ainda.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Opt-in</TableHead>
                        <TableHead>Perfil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(lead.created_at), "dd/MM/yy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.opted_in ? "default" : "secondary"}>
                              {lead.opted_in ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {lead.profile_scores && Object.keys(lead.profile_scores).length > 0
                              ? Object.entries(lead.profile_scores).map(([k, v]) => `${k}: ${v}`).join(", ")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyses">
            <Card>
              <CardContent className="pt-6">
                {analyses.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma análise corporal realizada ainda.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.map((a) => {
                        const result = a.analysis_result as Record<string, unknown> | null;
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="text-muted-foreground">{a.email}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {format(new Date(a.created_at), "dd/MM/yy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {a.model_used ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                              {result
                                ? `${(result as any).body_type ?? ""} | BF: ${(result as any).estimated_bf_range ?? ""}`
                                : "Pendente"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkouts">
            <Card>
              <CardContent className="pt-6">
                {checkouts.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhum evento de checkout registrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkouts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-muted-foreground">{c.email}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "completed" ? "default" : "secondary"}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(c.created_at), "dd/MM/yy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
