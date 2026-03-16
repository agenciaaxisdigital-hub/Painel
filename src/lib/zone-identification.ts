import { ZONAS_ELEITORAIS, ZONE_COLOR_MAP } from "./constants";

// ── Zone neighborhood map (case/accent insensitive matching) ──
const ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "1ª": [
    "Jardim Goiás","Setor Bueno","St Bueno","Setor Marista","Setor Sul","Setor Sudoeste",
    "Setor Pedro Ludovico","Setor Bela Vista","Jardim América","Setor Nova Suíça","Setor Aeroporto",
    "Setor Leste Universitário","Setor Coimbra","Parque Amazônia","Setor Leste","Jardim Planalto",
    "Setor Nova Vila","Parque Lozandes","Setor Bela Aliança","Alto da Glória","Jardim Guanabara",
    "Parque Flamboyant","Setor Acaba Mundo","Setor Campinas","Jardim São Paulo","Jardim Novo Mundo","Vila Nova",
  ],
  "2ª": [
    "Setor Central","Setor Norte Ferroviário","Vila Nova","Setor Santos Dumont","Setor dos Funcionários",
    "Vila União","Setor Crimeia Leste","Setor Crimeia Oeste","Jardim Balneário","Setor Universitário",
    "Setor Aeroviário","Bairro Perim sul","Setor Dom Fernando","Setor Tocantins","Setor Cruzeiro",
    "Setor Marechal Rondon","Vila Brasília","Vila Aurora","Vila Canaã","Jardim das Flores",
    "Setor Dom Bosco","Vila Jaraguá","Vila Ipiranga","Jardim Helvécia",
  ],
  "127ª": [
    "Jardim das Esmeraldas","Jardim Presidente","Parque Amazônia sul","Residencial Eldorado",
    "Setor Jardim da Luz","Jardim das Oliveiras","Vila Redenção","Conjunto Vera Cruz",
    "Parque das Laranjeiras","Setor Pedro Ludovico sul","Jardim Curitiba sul","Setor Capuava",
    "Jardim Morumbi","Setor Barra dos Coqueiros","Jardim Novo Horizonte sul","Jardim das Acácias",
    "Parque Tremendão sul","Residencial Aldeia do Vale","Jardim Atlântico sul","Setor Sul Jamil Miguel",
    "Jardim São Judas Tadeu","Jardim Primavera","Jardim dos Ipês","Vila Brasília sul",
  ],
  "133ª": [
    "Setor Faiçalville","Jardim Atlântico","Residencial Montreal","Vila Brasília norte",
    "Jardim Fonte Nova","Jardim das Acácias norte","Setor Universitário norte","Jardim Guanabara norte",
    "Residencial Buena Vista","Setor dos Afonsos","Jardim Europa norte","Parque Tremendão norte",
    "Setor Bela Vista norte","Jardim Planalto sul","Setor Pedro Ludovico norte","Vila Nova norte",
    "Jardim Novo Mundo norte","Setor Campinas norte","Residencial Goiânia Viva","Parque São Jorge",
    "Residencial Santa Fé","Chácara Recreio Samambaia","Jardim Presidente norte",
  ],
  "134ª": [
    "Conjunto Vera Cruz","Jardim Cerrado","Residencial Araguaia","Setor Recanto do Bosque",
    "Vila Mutirão","Jardim Curitiba","Residencial Flamboyant","Conjunto Caiçara","Residencial Coimbra",
    "Jardim Dom Fernando","Jardim Florença","Residencial Eldorado norte","Residencial Independência",
    "Jardim América oeste","Chácaras Retiro","Setor Dom Fernando","Parque das Laranjeiras oeste",
    "Setor Morada do Sol oeste","Parque Industrial João Braz","Residencial Barravento","Jardim Conceição",
    "Residencial Botânico","Jardim Marcelino","Parque Esplanada","Jardim Vitória",
    "Chácara Recreio Bernardo Sayão","Conjunto Baliza","Bairro Bernardo Sayão","Jardim São Joaquim",
    "Setor Lúzio Veiga","Residencial Três Marias",
  ],
  "135ª": [
    "Setor Jardim Europa","Residencial Vale dos Sonhos","Jardim Balneário Meia Ponte",
    "Vila Santa Helena","Setor dos Afonsos sul","Residencial Granville","Jardim Novo Horizonte norte",
    "Residencial Aldeia do Vale norte","Parque Tremendão leste","Setor Faiçalville norte",
    "Residencial Montreal norte","Jardim Atlântico norte","Setor Nova Fronteira",
    "Residencial Araguaia norte","Residencial Santa Genoveva norte","Conjunto Riviera norte",
    "Residencial Paraíso do Sol","Jardim Guanabara leste","Jardim Serra Dourada",
    "Residencial Mirante do Leste","Residencial Bela Vista","Parque das Flores",
    "Jardim Novo Paraíso","Setor Andréia","Setor Bela Suíça",
  ],
  "136ª": [
    "Setor Perim","Bairro Feliz","Vila Redenção Sul","Jardim Bela Vista","Boa Esperança",
    "Setor Goiânia 2","Jardim Novo Horizonte sul","Vila Bela Aliança","Parque Industrial João Braz sul",
    "Jardim Grajaú","Vila Esperança","Setor Santa Cruz","Bairro Bela Vista","Setor Morada do Sol sul",
    "Jardim Dom Fernando sul","Residencial Coimbra sul","Jardim São Gonçalo",
    "Chácara dos Bandeirantes sul","Vila Concórdia","Jardim Novo Oriente","Residencial Flamboyant sul",
    "Jardim Três Marias","Setor Goiânia 2 ampliação","Bairro São Carlos","Jardim Petrópolis",
    "Parque Santa Cruz","Setor dos Funcionários sul",
  ],
  "146ª": [
    "Setor Santa Genoveva","Conjunto Riviera","Jardim Planalto norte","Parque Atheneu",
    "Sítio de Recreio Ipê","São Domingos","Residencial Granville norte","São Patrício","Setor Fama",
    "Chácara do Governador","Parque das Laranjeiras norte","Criméia leste norte",
    "Residencial Monte Sinai","Conjunto Caiçara norte","Residencial Primavera","Setor Santa Luzia",
    "Parque Tremendão norte","Jardim Novo Paraíso norte","Jardim Serra Dourada norte",
    "Residencial Eldorado leste","Setor Dom Fernando norte","Jardim Orion","Bairro Bom Retiro",
    "Condomínio Samambaia","Residencial San Joaquim","Setor Santa Fé","Parque Piauí",
    "Sítio Recreio das Laranjeiras","Parque Industrial norte","Jardim Tiradentes",
    "Setor Criméia Oeste norte","Sítio de Recreio Ipê norte","Residencial Aldeia Park",
  ],
  "147ª": [
    "Conjunto Caiçara","Jardim Dom Fernando","Setor Morada do Sol","Chácara Coimbra",
    "Jardim Cerrado norte","Residencial Flamboyant norte","Jardim Reny","Chácara dos Bandeirantes",
    "Residencial Fonte das Águas","Jardim Dom Fernando II","Jardim Guanabara II",
    "Residencial Bandeirantes","Chácara Recreio Bandeirantes","Conjunto Barravento","Setor Perim norte",
    "Setor dos Funcionários norte","Jardim Camargo","Vila Camargo","Chácara Meireles",
    "Jardim Novo Oriente norte","Jardim das Flores norte","Setor Bela Vista sul",
    "Residencial Buena Vista norte","Parque Primavera","Setor Campinas sul","Jardim Cerrado II",
  ],
};

// Zone centroids for coordinate-based fallback
const ZONE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "1ª": { lat: -16.6864, lng: -49.2553 },
  "2ª": { lat: -16.6720, lng: -49.2501 },
  "127ª": { lat: -16.7198, lng: -49.2695 },
  "133ª": { lat: -16.6953, lng: -49.2254 },
  "134ª": { lat: -16.7201, lng: -49.2948 },
  "135ª": { lat: -16.6598, lng: -49.2198 },
  "136ª": { lat: -16.7482, lng: -49.2683 },
  "146ª": { lat: -16.6451, lng: -49.2601 },
  "147ª": { lat: -16.7003, lng: -49.2849 },
};

// Normalize string for comparison (remove accents, lowercase)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Calculate distance between two coordinates (Haversine)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface ZoneResult {
  zona: string;
  nome: string;
  cor: string;
  eleitores: number;
  method: "database" | "bairro" | "coordinates" | "aparecida" | "unknown";
}

/**
 * Identify zone from available data, with cascading fallback:
 * 1. Direct zona_eleitoral field
 * 2. Bairro matching
 * 3. Coordinate proximity
 * 4. City-based (Aparecida de Goiânia)
 */
export function identifyZone(params: {
  zona_eleitoral?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ZoneResult {
  const { zona_eleitoral, bairro, cidade, latitude, longitude } = params;

  // 1. Direct from database
  if (zona_eleitoral && zona_eleitoral !== "Não identificada" && zona_eleitoral.trim()) {
    const zoneData = ZONAS_ELEITORAIS.find((z) => z.zona === zona_eleitoral);
    return {
      zona: zona_eleitoral,
      nome: zoneData?.nome || "",
      cor: zoneData?.cor || ZONE_COLOR_MAP[zona_eleitoral] || "#888",
      eleitores: zoneData?.eleitores || 0,
      method: "database",
    };
  }

  // 2. Bairro matching
  if (bairro && bairro.trim()) {
    const normalizedBairro = normalize(bairro);
    for (const [zona, neighborhoods] of Object.entries(ZONE_NEIGHBORHOODS)) {
      if (neighborhoods.some((n) => normalize(n) === normalizedBairro)) {
        const zoneData = ZONAS_ELEITORAIS.find((z) => z.zona === zona);
        return {
          zona,
          cor: zoneData?.cor || "#888",
          eleitores: zoneData?.eleitores || 0,
          method: "bairro",
        };
      }
    }
  }

  // 3. Coordinate proximity
  if (latitude && longitude) {
    let minDist = Infinity;
    let closestZone = "";
    for (const [zona, centroid] of Object.entries(ZONE_CENTROIDS)) {
      const dist = haversineDistance(latitude, longitude, centroid.lat, centroid.lng);
      if (dist < minDist) {
        minDist = dist;
        closestZone = zona;
      }
    }
    // Only assign if within ~15km (reasonable for Goiânia)
    if (minDist < 15 && closestZone) {
      const zoneData = ZONAS_ELEITORAIS.find((z) => z.zona === closestZone);
      return {
        zona: closestZone,
        cor: zoneData?.cor || "#888",
        eleitores: zoneData?.eleitores || 0,
        method: "coordinates",
      };
    }
  }

  // 4. Aparecida de Goiânia
  if (cidade && normalize(cidade) === normalize("Aparecida de Goiânia")) {
    return { zona: "Aparecida de Goiânia", cor: "#9CA3AF", eleitores: 0, method: "aparecida" };
  }

  return { zona: "Não identificada", cor: "#6B7280", eleitores: 0, method: "unknown" };
}

/**
 * Get location precision level
 */
export type LocationPrecision = "gps" | "ip_coords" | "ip_only";

export function getLocationPrecision(params: {
  latitude?: number | null;
  longitude?: number | null;
  bairro?: string | null;
}): LocationPrecision {
  if (params.latitude && params.longitude && params.bairro) return "gps";
  if (params.latitude && params.longitude) return "ip_coords";
  return "ip_only";
}

export const PRECISION_CONFIG: Record<LocationPrecision, { label: string; color: string; bgColor: string }> = {
  gps: { label: "GPS Preciso", color: "text-success", bgColor: "bg-success/10" },
  ip_coords: { label: "IP com Coordenadas", color: "text-secondary", bgColor: "bg-secondary/10" },
  ip_only: { label: "Localização estimada por IP", color: "text-muted-foreground", bgColor: "bg-muted/50" },
};
