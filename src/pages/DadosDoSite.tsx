import { useState } from "react";
import { SectionNav } from "@/components/shared/SectionNav";
import { SecaoVisaoGeral } from "@/components/dados-site/SecaoVisaoGeral";
import { SecaoVisitantes } from "@/components/dados-site/SecaoVisitantes";
import { SecaoFormularios } from "@/components/dados-site/SecaoFormularios";
import { SecaoEngajamento } from "@/components/dados-site/SecaoEngajamento";
import { SecaoComportamento } from "@/components/dados-site/SecaoComportamento";
import { SecaoEleitoresFrequentes } from "@/components/dados-site/SecaoEleitoresFrequentes";

export default function DadosDoSite() {
  const [selectedDays, setSelectedDays] = useState(30);

  return (
    <div className="space-y-0">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Dados do Site</h1>
        <p className="text-sm text-muted-foreground">Painel completo de inteligência da campanha Chama Rosa</p>
      </div>

      <SectionNav />

      <div className="space-y-16 pt-6">
        <SecaoVisaoGeral selectedDays={selectedDays} onDaysChange={setSelectedDays} />
        
        <div className="border-t border-border/30" />
        <SecaoVisitantes />
        
        <div className="border-t border-border/30" />
        <SecaoFormularios />
        
        <div className="border-t border-border/30" />
        <SecaoEngajamento />
        
        <div className="border-t border-border/30" />
        <SecaoComportamento />
        
        <div className="border-t border-border/30" />
        <SecaoEleitoresFrequentes />
      </div>
    </div>
  );
}
