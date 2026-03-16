import { useState, useEffect } from "react";
import { Copy, MapPin, Loader2, MapPinned, Navigation } from "lucide-react";
import { identifyZone, type ZoneResult } from "@/lib/zone-identification";

export type PrecisionType = "GPS_PRECISO" | "IP_APROXIMADO";

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
  precisao_localizacao?: string | null;
}

/**
 * Infer precision from available fields when precisao_localizacao is not set.
 * GPS_PRECISO: has lat/lng AND bairro (real GPS with neighborhood)
 * IP_APROXIMADO: only city-level data or lat/lng without bairro
 */
export function inferPrecision(data: LocationData): PrecisionType {
  // Explicit field takes priority
  if (data.precisao_localizacao === "GPS_PRECISO") return "GPS_PRECISO";
  if (data.precisao_localizacao === "IP_APROXIMADO") return "IP_APROXIMADO";

  // Infer: lat/lng + bairro = GPS precise
  if (data.latitude && data.longitude && data.bairro?.trim()) return "GPS_PRECISO";

  // Everything else is IP approximation
  return "IP_APROXIMADO";
}

// ── Reverse Geocoding Hook ──
function useReverseGeocode(lat?: number | null, lng?: number | null, hasAddress?: boolean) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (hasAddress || !lat || !lng || result) return;
    let cancelled = false;
    setLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
      { headers: { "User-Agent": "ChamaRosa/1.0" } }
    )
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setResult(data.display_name || "Endereço não encontrado"); })
      .catch(() => { if (!cancelled) setResult("Erro ao buscar endereço"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng, hasAddress, result]);

  return { loading, result };
}

// ── Precision Badge (inline) ──
export function PrecisionBadge({ data, size = "sm" }: { data: LocationData; size?: "sm" | "xs" }) {
  const precision = inferPrecision(data);
  const isGps = precision === "GPS_PRECISO";
  const dotSize = size === "xs" ? "h-1.5 w-1.5" : "h-2 w-2";
  const textSize = size === "xs" ? "text-[8px]" : "text-[10px]";

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span className={`${dotSize} rounded-full shrink-0 ${isGps ? "bg-success" : "bg-muted-foreground/50"}`} />
      <span className={isGps ? "text-success font-medium" : "text-muted-foreground italic"}>
        {isGps ? "GPS Preciso" : "Aprox. via IP"}
      </span>
    </span>
  );
}

// ── Zone Badge with precision indicator ──
export function ZoneBadge({ data, showEleitores = false }: { data: LocationData; showEleitores?: boolean }) {
  const zone = identifyZone(data);
  const precision = inferPrecision(data);
  const isApprox = precision === "IP_APROXIMADO";

  if (zone.zona === "Não identificada") {
    return <span className="text-[10px] text-muted-foreground/50">Zona não identificada</span>;
  }

  const displayLabel = zone.zona.includes("Zona Aparecida") || zone.categoria === "interior"
    ? zone.zona
    : `${zone.zona} Zona`;

  // Add ~ prefix for IP-approximated zones
  const prefix = isApprox ? "~" : "";

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ opacity: isApprox ? 0.6 : 1 }}>
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: zone.cor }} />
      <span className="font-medium" style={{ color: zone.cor }}>{prefix}{displayLabel}</span>
      {isApprox && <span className="text-muted-foreground/50 text-[8px]">(IP)</span>}
      {showEleitores && zone.eleitores > 0 && (
        <span className="text-muted-foreground/50">({zone.eleitores.toLocaleString("pt-BR")} eleitores)</span>
      )}
    </span>
  );
}

// ── Compact Location (for table cells) ──
export function CompactLocation({ data }: { data: LocationData }) {
  const precision = inferPrecision(data);
  const isGps = precision === "GPS_PRECISO";
  const bairro = data.bairro?.trim();
  const cidade = data.cidade?.trim();
  const estado = data.estado?.trim();
  const rua = data.rua?.trim();
  const zone = identifyZone(data);

  // Build the most complete address possible regardless of precision
  let mainText = "";
  if (rua && bairro && cidade) {
    mainText = `${rua}, ${bairro}, ${cidade}`;
  } else if (bairro && cidade) {
    mainText = `${bairro}, ${cidade}`;
  } else if (cidade) {
    mainText = `${cidade}${estado ? `, ${estado}` : ""}`;
  } else {
    mainText = "Cidade não identificada";
  }

  return (
    <div className="space-y-0.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isGps ? "bg-success" : "bg-muted-foreground/40"}`} />
        <span className={`text-xs truncate ${isGps ? "text-foreground/80" : "text-foreground/70"}`}>{mainText}</span>
      </div>
      {zone.zona !== "Não identificada" && (
        <span className="inline-flex items-center gap-1 text-[9px]" style={{ opacity: isGps ? 1 : 0.7 }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: zone.cor }} />
          <span style={{ color: zone.cor }}>{isGps ? "" : "~"}{zone.zona}</span>
          {!isGps && <span className="text-muted-foreground/40 text-[8px]">(IP)</span>}
        </span>
      )}
    </div>
  );
}

// ── Full Location Detail (for expanded views / drawers) ──
export function FullLocationDetail({ data, onCopy }: { data: LocationData; onCopy?: (text: string) => void }) {
  const precision = inferPrecision(data);
  const isGps = precision === "GPS_PRECISO";
  const zone = identifyZone(data);
  const hasAddr = !!data.endereco_completo;
  const geocode = useReverseGeocode(isGps ? data.latitude : null, isGps ? data.longitude : null, hasAddr);
  const hasCoords = data.latitude != null && data.longitude != null;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    onCopy?.(text);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">Localização Completa</h4>
      </div>

      {/* Precision Badge — prominent at top */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isGps ? "bg-success/5 border border-success/20" : "bg-muted/30 border border-border/30"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${isGps ? "bg-success" : "bg-muted-foreground/40"}`} />
        <span className={`text-[11px] font-medium ${isGps ? "text-success" : "text-muted-foreground"}`}>
          {isGps ? "GPS Preciso" : "Localização aproximada por IP"}
        </span>
      </div>

      <div className="space-y-1.5">
        {isGps ? (
          /* GPS_PRECISO: Show full address details */
          <>
            {data.endereco_completo && <DetailRow label="Endereço Completo" value={data.endereco_completo} />}
            {!data.endereco_completo && geocode.result && <DetailRow label="Endereço Completo" value={geocode.result} />}
            {!data.endereco_completo && !geocode.result && hasCoords && geocode.loading && (
              <div className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground shrink-0 w-28">Endereço Completo</span>
                <span className="flex items-center gap-1 text-muted-foreground/60">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando endereço...
                </span>
              </div>
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

            {hasCoords && (
              <div className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground shrink-0 w-28">Coordenadas</span>
                <span className="text-foreground/80 tabular-nums">{data.latitude!.toFixed(6)}, {data.longitude!.toFixed(6)}</span>
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
                  <span className="font-medium" style={{ color: zone.cor }}>{zone.zona} — {zone.nome}</span>
                  {zone.eleitores > 0 && <span className="text-muted-foreground/50">({zone.eleitores.toLocaleString("pt-BR")} eleitores)</span>}
                </span>
              </div>
            )}
          </>
        ) : (
          /* IP_APROXIMADO: Show only city-level data */
          <>
            <DetailRow label="Cidade" value={data.cidade || "Cidade não identificada"} />
            {data.estado && <DetailRow label="Estado" value={data.estado} />}

            {hasCoords && (
              <div className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground shrink-0 w-28">Coordenadas</span>
                <span className="text-muted-foreground/60 tabular-nums italic">~{data.latitude!.toFixed(4)}, {data.longitude!.toFixed(4)}</span>
                <span className="text-[9px] text-muted-foreground/40">(Aprox.)</span>
              </div>
            )}

            {zone.zona !== "Não identificada" && (
              <div className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground shrink-0 w-28">Zona Eleitoral</span>
                <span className="inline-flex items-center gap-1.5" style={{ opacity: 0.6 }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.cor }} />
                  <span className="font-medium" style={{ color: zone.cor }}>~{zone.zona}</span>
                  <span className="rounded-full bg-secondary/10 px-1.5 py-0 text-[8px] text-secondary">Identificada por IP</span>
                </span>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/50 italic mt-2">
              Endereço preciso não disponível — localização baseada no IP de acesso.
            </p>
          </>
        )}
      </div>

      {/* Mini Map — only for GPS_PRECISO */}
      {isGps && hasCoords && (
        <MiniMap lat={data.latitude!} lng={data.longitude!} />
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
