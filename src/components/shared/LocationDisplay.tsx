import { Copy, MapPin } from "lucide-react";
import { identifyZone, getLocationPrecision, PRECISION_CONFIG, type ZoneResult } from "@/lib/zone-identification";

interface LocationData {
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
  cep?: string | null;
  endereco_completo?: string | null;
  rua?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  zona_eleitoral?: string | null;
  regiao_planejamento?: string | null;
}

// ── Precision Badge ──
export function PrecisionBadge({ data }: { data: LocationData }) {
  const precision = getLocationPrecision(data);
  const cfg = PRECISION_CONFIG[precision];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bgColor} ${cfg.color}`}>
      <MapPin className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ── Zone Badge ──
export function ZoneBadge({ data, showEleitores = false }: { data: LocationData; showEleitores?: boolean }) {
  const zone = identifyZone(data);
  if (zone.zona === "Não identificada") {
    return <span className="text-[10px] text-muted-foreground/50">Zona não identificada</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px]">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: zone.cor }} />
      <span className="font-medium" style={{ color: zone.cor }}>{zone.zona} Zona</span>
      {showEleitores && zone.eleitores > 0 && (
        <span className="text-muted-foreground/50">({zone.eleitores.toLocaleString("pt-BR")} eleitores)</span>
      )}
    </span>
  );
}

// ── Compact Location (for table cells) ──
export function CompactLocation({ data }: { data: LocationData }) {
  const bairro = data.bairro?.trim();
  const cidade = data.cidade?.trim();
  const estado = data.estado?.trim();
  const location = [cidade, estado].filter(Boolean).join(", ");
  const zone = identifyZone(data);

  return (
    <div className="space-y-0.5 min-w-0">
      {bairro ? (
        <>
          <div className="text-foreground/80 text-xs truncate">{bairro}</div>
          <div className="text-[10px] text-muted-foreground truncate">{location || "—"}</div>
        </>
      ) : (
        <div className="text-foreground/70 text-xs truncate">{location || "Cidade não identificada"}</div>
      )}
      {zone.zona !== "Não identificada" && (
        <span className="inline-flex items-center gap-1 text-[9px]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: zone.cor }} />
          <span style={{ color: zone.cor }}>{zone.zona}</span>
        </span>
      )}
    </div>
  );
}

// ── Full Location Detail (for expanded views / drawers) ──
export function FullLocationDetail({ data, onCopy }: { data: LocationData; onCopy?: (text: string) => void }) {
  const precision = getLocationPrecision(data);
  const zone = identifyZone(data);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    onCopy?.(text);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">Localização Completa</h4>
        <PrecisionBadge data={data} />
      </div>

      <div className="space-y-1.5">
        {data.endereco_completo && (
          <DetailRow label="Endereço Completo" value={data.endereco_completo} />
        )}
        {data.rua && <DetailRow label="Rua" value={data.rua} />}
        {data.bairro && (
          <div className="flex items-start gap-2 text-[11px]">
            <span className="text-muted-foreground shrink-0 w-28">Bairro</span>
            <span className="text-foreground/80">{data.bairro}</span>
            {zone.zona !== "Não identificada" && (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[9px]" style={{ backgroundColor: `${zone.cor}15`, color: zone.cor }}>
                {zone.zona}
              </span>
            )}
          </div>
        )}
        {data.cep && <DetailRow label="CEP" value={data.cep} />}
        <DetailRow label="Cidade" value={data.cidade || "Cidade não identificada"} />
        {data.estado && <DetailRow label="Estado" value={data.estado} />}
        {data.regiao_planejamento && <DetailRow label="Região de Planejamento" value={data.regiao_planejamento} />}

        {data.latitude != null && data.longitude != null && (
          <div className="flex items-start gap-2 text-[11px]">
            <span className="text-muted-foreground shrink-0 w-28">Coordenadas</span>
            <span className="text-foreground/80 tabular-nums">{data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}</span>
            <button onClick={() => copyText(`${data.latitude}, ${data.longitude}`)} className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors">
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}

        {zone.zona !== "Não identificada" && (
          <div className="flex items-start gap-2 text-[11px]">
            <span className="text-muted-foreground shrink-0 w-28">Zona Eleitoral</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.cor }} />
              <span className="font-medium" style={{ color: zone.cor }}>{zone.zona} Zona</span>
              {zone.eleitores > 0 && <span className="text-muted-foreground/50">({zone.eleitores.toLocaleString("pt-BR")} eleitores)</span>}
            </span>
          </div>
        )}
      </div>

      {/* Mini Map */}
      {data.latitude != null && data.longitude != null && (
        <MiniMap lat={data.latitude} lng={data.longitude} />
      )}
    </div>
  );
}

// ── Mini Map ──
export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-border/30">
      <iframe
        title="Localização"
        width="100%"
        height="200"
        style={{ border: 0 }}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.004}%2C${lng + 0.005}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`}
      />
    </div>
  );
}

// ── Detail Row helper ──
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="text-muted-foreground shrink-0 w-28">{label}</span>
      <span className={`text-foreground/80 break-all ${!value ? "text-muted-foreground/40" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
