import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { generateTimeSeriesData, kpiData, deviceData, trafficData, topPagesData } from "@/lib/mock-data";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";

const datePresets = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "3 meses", days: 90 },
];

export default function Dashboard() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [visibleSeries, setVisibleSeries] = useState({ visitantes: true, formularios: true, cliquesWhatsapp: true, cliquesInstagram: true });
  const timeData = useMemo(() => generateTimeSeriesData(selectedDays), [selectedDays]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const seriesConfig = [
    { key: "visitantes", name: "Visitantes", color: "hsl(341, 90%, 65%)" },
    { key: "formularios", name: "Formulários", color: "hsl(45, 93%, 47%)" },
    { key: "cliquesWhatsapp", name: "WhatsApp", color: "hsl(142, 71%, 45%)" },
    { key: "cliquesInstagram", name: "Instagram", color: "hsl(280, 70%, 60%)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">Painel de inteligência da campanha Chama Rosa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard titulo="Total Visitantes" valor={kpiData.totalVisitantes.valor} variacao={kpiData.totalVisitantes.variacao} sparkline={kpiData.totalVisitantes.sparkline} tooltip="Número total de pessoas que acessaram o site da campanha. Quanto maior, mais alcance tem a campanha digital." delay={0} />
        <KPICard titulo="Novos Eleitores" valor={kpiData.novosEleitores.valor} variacao={kpiData.novosEleitores.variacao} sparkline={kpiData.novosEleitores.sparkline} tooltip="Pessoas que preencheram o formulário de contato. São potenciais apoiadores diretos da campanha." delay={1} />
        <KPICard titulo="Cliques WhatsApp" valor={kpiData.cliquesWhatsapp.valor} variacao={kpiData.cliquesWhatsapp.variacao} sparkline={kpiData.cliquesWhatsapp.sparkline} tooltip="Quantas vezes os visitantes clicaram para entrar em contato pelo WhatsApp. Indica interesse direto em conversar." delay={2} />
        <KPICard titulo="Cliques Instagram" valor={kpiData.cliquesInstagram.valor} variacao={kpiData.cliquesInstagram.variacao} sparkline={kpiData.cliquesInstagram.sparkline} tooltip="Quantas vezes os visitantes clicaram para acessar o Instagram da campanha. Mostra engajamento nas redes sociais." delay={3} />
        <KPICard titulo="Taxa Conversão" valor={kpiData.taxaConversao.valor} variacao={kpiData.taxaConversao.variacao} sparkline={kpiData.taxaConversao.sparkline} tooltip="Percentual de visitantes que preencheram o formulário. Calculado dividindo formulários pelo total de visitantes. Quanto maior, mais eficiente é o site em engajar as pessoas." suffix="%" decimals={2} delay={4} />
        <KPICard titulo="Visitantes Agora" valor={kpiData.visitantesAgora.valor} variacao={0} sparkline={kpiData.visitantesAgora.sparkline} tooltip="Número de pessoas acessando o site neste exato momento. Atualiza automaticamente." pulse delay={5} />
      </div>

      {/* Main Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">Evolução Diária</h3>
            <InfoTooltip text="Mostra como os números evoluem ao longo do tempo. Clique nas legendas para mostrar ou esconder cada série." />
          </div>
          <div className="flex gap-1">
            {datePresets.map((p) => (
              <button
                key={p.days}
                onClick={() => setSelectedDays(p.days)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selectedDays === p.days ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
              <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(240, 5%, 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "hsl(0, 0%, 70%)" }}
              />
              <Legend
                onClick={(e) => toggleSeries(e.dataKey as string)}
                wrapperStyle={{ fontSize: "12px", cursor: "pointer" }}
              />
              {seriesConfig.map((s) =>
                visibleSeries[s.key as keyof typeof visibleSeries] && (
                  <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: s.color, strokeWidth: 2 }} />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Donut Charts + Activity Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Devices */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-foreground">Dispositivos</h3>
            <InfoTooltip text="Mostra se os visitantes usam celular, computador ou tablet. Importante para saber como otimizar o site." />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {deviceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Traffic Origin */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-foreground">Origem do Tráfego</h3>
            <InfoTooltip text="De onde os visitantes vêm antes de acessar o site. Ajuda a entender quais redes sociais e canais funcionam melhor." />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {trafficData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Pages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-foreground">Páginas Mais Visitadas</h3>
            <InfoTooltip text="Quais páginas do site recebem mais acessos. Mostra o que mais interessa ao eleitorado." />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPagesData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <YAxis type="category" dataKey="pagina" stroke="hsl(240, 5%, 40%)" fontSize={10} tickLine={false} />
                <Bar dataKey="visitas" fill="hsl(341, 90%, 65%)" radius={[0, 4, 4, 0]} barSize={16} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </div>
  );
}
