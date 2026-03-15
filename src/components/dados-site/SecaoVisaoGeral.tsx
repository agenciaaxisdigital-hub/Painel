import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { generateTimeSeriesData, kpiData } from "@/lib/mock-data";

interface Props {
  selectedDays: number;
  onDaysChange: (d: number) => void;
}

const seriesConfig = [
  { key: "visitantes", name: "Visitantes", color: "hsl(341, 90%, 65%)" },
  { key: "formularios", name: "Formulários", color: "hsl(45, 93%, 47%)" },
  { key: "cliquesWhatsapp", name: "WhatsApp", color: "hsl(142, 71%, 45%)" },
  { key: "cliquesInstagram", name: "Instagram", color: "hsl(280, 70%, 60%)" },
];

export function SecaoVisaoGeral({ selectedDays, onDaysChange }: Props) {
  const [visibleSeries, setVisibleSeries] = useState({ visitantes: true, formularios: true, cliquesWhatsapp: true, cliquesInstagram: true });
  const timeData = useMemo(() => generateTimeSeriesData(selectedDays), [selectedDays]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <section id="visao-geral" className="space-y-6 scroll-mt-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Visão Geral</h2>
          <p className="text-xs text-muted-foreground">Métricas consolidadas da campanha digital</p>
        </div>
        <DateRangeSelector selectedDays={selectedDays} onChange={onDaysChange} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard titulo="Total Visitantes" valor={kpiData.totalVisitantes.valor} variacao={kpiData.totalVisitantes.variacao} sparkline={kpiData.totalVisitantes.sparkline} tooltip="Número total de pessoas que acessaram o site da campanha." delay={0} />
        <KPICard titulo="Novos Eleitores" valor={kpiData.novosEleitores.valor} variacao={kpiData.novosEleitores.variacao} sparkline={kpiData.novosEleitores.sparkline} tooltip="Pessoas que preencheram o formulário de contato." delay={1} />
        <KPICard titulo="Cliques WhatsApp" valor={kpiData.cliquesWhatsapp.valor} variacao={kpiData.cliquesWhatsapp.variacao} sparkline={kpiData.cliquesWhatsapp.sparkline} tooltip="Cliques para contato via WhatsApp." delay={2} />
        <KPICard titulo="Cliques Instagram" valor={kpiData.cliquesInstagram.valor} variacao={kpiData.cliquesInstagram.variacao} sparkline={kpiData.cliquesInstagram.sparkline} tooltip="Cliques para acessar o Instagram da campanha." delay={3} />
        <KPICard titulo="Taxa Conversão" valor={kpiData.taxaConversao.valor} variacao={kpiData.taxaConversao.variacao} sparkline={kpiData.taxaConversao.sparkline} tooltip="Percentual de visitantes que preencheram formulário." suffix="%" decimals={2} delay={4} />
        <KPICard titulo="Visitantes Agora" valor={kpiData.visitantesAgora.valor} variacao={0} sparkline={kpiData.visitantesAgora.sparkline} tooltip="Pessoas acessando o site neste momento." pulse delay={5} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">Evolução Diária</h3>
            <InfoTooltip text="Clique nas legendas para mostrar ou esconder cada série." />
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
              <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(240, 5%, 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "hsl(0, 0%, 70%)" }} />
              <Legend onClick={(e) => toggleSeries(e.dataKey as string)} wrapperStyle={{ fontSize: "12px", cursor: "pointer" }} />
              {seriesConfig.map((s) =>
                visibleSeries[s.key as keyof typeof visibleSeries] && (
                  <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: s.color, strokeWidth: 2 }} />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </section>
  );
}
