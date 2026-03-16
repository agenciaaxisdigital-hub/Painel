import { ZONAS_ELEITORAIS, ZONAS_APARECIDA, ZONE_COLOR_MAP } from "./constants";

// ── Normalize string for comparison ──
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ── Haversine distance (km) ──
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ══════════════════════════════════════════════
// GOIÂNIA ZONE NEIGHBORHOODS
// ══════════════════════════════════════════════
const GOIANIA_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "1ª": [
    "Jardim Goiás","Setor Bueno","St Bueno","St. Bueno","Setor Marista","Setor Sul","Setor Sudoeste",
    "Setor Pedro Ludovico","Setor Bela Vista","Jardim América","Setor Nova Suíça","Setor Aeroporto",
    "Setor Leste Universitário","Setor Coimbra","Parque Amazônia","Alto da Glória","Setor Acaba Mundo",
    "Jardim Guanabara","Parque Flamboyant","Setor Leste","Jardim Planalto","Setor Nova Vila",
    "Parque Lozandes","Bela Aliança","Setor Nova Aliança","Jardim São Paulo","Jardim Novo Mundo",
    "Vila Nova","Setor Campinas","Setor Santos Dumont","Setor Aeroviário","Setor Marechal Rondon",
    "Jardim Balneário","Setor Tocantins","Setor Cruzeiro","Setor Dom Bosco","Vila Jaraguá",
    "Vila Ipiranga","Vila Aurora","Vila Canaã",
  ],
  "2ª": [
    "Setor Central","Setor Norte Ferroviário","Vila União","Setor Crimeia Leste","Setor Crimeia Oeste",
    "Setor dos Funcionários","Setor Dom Fernando","Vila Brasília","Jardim Helvécia","Setor Universitário",
    "Setor Cruzeiro do Sul","Jardim das Flores","Vila Ipiranga norte","Setor Tocantins norte",
    "Setor dos Afonsos","Jardim Balneário norte","Vila São Thomaz","Setor Marechal Rondon norte",
    "Jardim Conceição","Bairro Bom Retiro","Setor Santa Cruz norte","Parque Industrial João Braz norte",
    "Vila Concórdia","Jardim Petrópolis norte","Parque Santa Cruz norte","Setor Dom Bosco norte",
    "Jardim Camargo","Vila Camargo","Chácara Meireles","Vila Esperança",
  ],
  "127ª": [
    "Jardim das Esmeraldas","Jardim Presidente","Residencial Eldorado","Setor Jardim da Luz",
    "Jardim das Oliveiras","Vila Redenção","Conjunto Vera Cruz norte","Parque das Laranjeiras",
    "Setor Pedro Ludovico sul","Jardim Curitiba sul","Setor Capuava","Jardim Morumbi",
    "Setor Barra dos Coqueiros","Jardim Novo Horizonte sul","Jardim das Acácias norte",
    "Parque Tremendão sul","Residencial Aldeia do Vale","Jardim Atlântico sul",
    "Setor Sul Jamil Miguel","Jardim São Judas Tadeu","Jardim Primavera","Jardim dos Ipês",
    "Parque Amazônia sul","Jardim São Gonçalo norte","Residencial Monte Sinai norte",
    "Parque Piauí norte","Sítio Recreio das Laranjeiras norte","Jardim Tiradentes norte",
    "Residencial Aldeia Park norte",
  ],
  "133ª": [
    "Setor Faiçalville","Jardim Atlântico norte","Residencial Montreal","Vila Brasília norte",
    "Jardim Fonte Nova","Jardim das Acácias","Setor Universitário norte","Jardim Guanabara norte",
    "Residencial Buena Vista norte","Jardim Europa norte","Parque Tremendão norte",
    "Setor Bela Vista norte","Jardim Planalto sul","Setor Pedro Ludovico norte",
    "Residencial Goiânia Viva","Parque São Jorge","Residencial Santa Fé",
    "Chácara Recreio Samambaia","Jardim Presidente norte","Residencial Vale dos Sonhos norte",
    "Jardim Balneário Meia Ponte norte","Vila Santa Helena norte","Setor dos Afonsos norte",
    "Residencial Granville sul","Jardim Novo Horizonte norte","Residencial Aldeia do Vale norte",
    "Parque Tremendão leste","Setor Nova Fronteira","Residencial Araguaia norte",
    "Jardim Serra Dourada","Residencial Mirante do Leste","Residencial Bela Vista",
    "Parque das Flores","Jardim Novo Paraíso","Setor Andréia","Setor Bela Suíça",
  ],
  "134ª": [
    "Conjunto Vera Cruz","Jardim Cerrado","Residencial Araguaia","Setor Recanto do Bosque",
    "Vila Mutirão","Jardim Curitiba","Residencial Flamboyant","Conjunto Caiçara","Residencial Coimbra",
    "Jardim Dom Fernando","Jardim Florença","Residencial Independência","Jardim América oeste",
    "Chácaras Retiro","Parque das Laranjeiras oeste","Setor Morada do Sol oeste",
    "Parque Industrial João Braz","Residencial Barravento","Residencial Botânico",
    "Jardim Marcelino","Parque Esplanada","Jardim Vitória","Chácara Recreio Bernardo Sayão",
    "Conjunto Baliza","Bairro Bernardo Sayão","Jardim São Joaquim","Setor Lúzio Veiga",
    "Residencial Três Marias","Jardim Florença norte","Residencial Independência norte",
    "Jardim Dom Fernando II norte",
  ],
  "135ª": [
    "Setor Jardim Europa","Residencial Vale dos Sonhos","Jardim Balneário Meia Ponte",
    "Vila Santa Helena","Setor dos Afonsos sul","Residencial Granville",
    "Jardim Novo Horizonte leste","Residencial Aldeia do Vale leste","Parque Tremendão leste",
    "Setor Faiçalville norte","Residencial Montreal norte","Residencial Paraíso do Sol",
    "Jardim Guanabara leste","Setor Andréia sul","Setor Bela Suíça sul",
    "Jardim Novo Paraíso norte","Parque das Flores norte","Residencial Bela Vista norte",
    "Residencial Mirante do Leste norte",
  ],
  "136ª": [
    "Setor Perim","Bairro Feliz","Vila Redenção Sul","Jardim Bela Vista","Boa Esperança",
    "Setor Goiânia 2","Jardim Novo Horizonte sul","Vila Bela Aliança",
    "Parque Industrial João Braz sul","Jardim Grajaú","Vila Esperança","Setor Santa Cruz",
    "Setor Morada do Sol sul","Jardim Dom Fernando sul","Residencial Coimbra sul",
    "Jardim São Gonçalo","Chácara dos Bandeirantes sul","Vila Concórdia","Jardim Novo Oriente",
    "Residencial Flamboyant sul","Jardim Três Marias","Setor Goiânia 2 ampliação",
    "Bairro São Carlos","Jardim Petrópolis","Parque Santa Cruz","Setor dos Funcionários sul",
    "Conjunto Vera Cruz sul","Jardim Cerrado sul",
  ],
  "146ª": [
    "Setor Santa Genoveva","Conjunto Riviera","Jardim Planalto norte","Parque Atheneu",
    "Sítio de Recreio Ipê","São Domingos","Residencial Granville norte","São Patrício","Setor Fama",
    "Chácara do Governador","Parque das Laranjeiras norte","Residencial Monte Sinai",
    "Conjunto Caiçara norte","Residencial Primavera","Setor Santa Luzia","Jardim Orion",
    "Condomínio Samambaia","Residencial San Joaquim","Setor Santa Fé","Parque Piauí",
    "Sítio Recreio das Laranjeiras","Jardim Tiradentes","Setor Criméia Oeste norte",
    "Sítio de Recreio Ipê norte","Residencial Aldeia Park","Parque das Laranjeiras norte II",
  ],
  "147ª": [
    "Conjunto Caiçara norte","Jardim Dom Fernando norte","Setor Morada do Sol","Chácara Coimbra",
    "Jardim Reny","Chácara dos Bandeirantes","Residencial Fonte das Águas","Jardim Dom Fernando II",
    "Jardim Guanabara II","Residencial Bandeirantes","Chácara Recreio Bandeirantes",
    "Conjunto Barravento","Setor Perim norte","Jardim Camargo","Vila Camargo","Chácara Meireles",
    "Jardim Novo Oriente norte","Jardim das Flores norte","Setor Bela Vista sul",
    "Residencial Buena Vista norte","Parque Primavera","Setor Campinas sul","Jardim Cerrado II",
    "Residencial Flamboyant norte","Jardim Florença sul",
  ],
};

// ══════════════════════════════════════════════
// APARECIDA DE GOIÂNIA ZONE NEIGHBORHOODS
// ══════════════════════════════════════════════
const APARECIDA_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "1ª Zona Aparecida": [
    "Centro de Aparecida","Setor Garavelo","Jardim Primavera","Setor Expansão",
    "Vila Brasília Aparecida","Setor Ataíde","Setor dos Funcionários Aparecida",
    "Vila Santa Helena Aparecida","Parque das Acácias","Jardim Belvedere",
    "Setor Bueno Aparecida","Vila Rossi","Jardim Copacabana",
    "Setor Bela Vista Aparecida","Residencial Bela Vista Aparecida",
    "Setor Nova Vila Aparecida","Jardim América Aparecida","Vila Esperança Aparecida",
    "Residencial Santa Fé Aparecida","Parque das Laranjeiras Aparecida norte",
    "Jardim Guanabara Aparecida norte","Jardim Novo Mundo Aparecida",
    // Common simplified names
    "Centro","Garavelo","Garavelo Park",
  ],
  "2ª Zona Aparecida": [
    "Jardim Tiradentes Aparecida","Setor Conde dos Arcos","Parque Trindade",
    "Residencial Vale Verde","Parque Flamboyant Aparecida","Jardim Dom Fernando Aparecida",
    "Residencial Interlagos","Jardim Florença Aparecida","Vila São Tomás Aparecida",
    "Jardim Guanabara Aparecida","Jardim Olímpico","Residencial Independência Aparecida",
    "Jardim Cerrado Aparecida norte","Setor Morada do Sol Aparecida norte",
    "Residencial Coimbra Aparecida norte","Setor Santa Luzia Aparecida norte",
    "Jardim Novo Horizonte Aparecida norte","Jardim Planalto Aparecida norte",
    // Common simplified names
    "Jardim Tiradentes","Conde dos Arcos","Parque Trindade","Jardim Olímpico",
  ],
  "3ª Zona Aparecida": [
    "Setor Vila Brasília Aparecida","Jardim Bela Vista Aparecida",
    "Parque Anhanguera Aparecida","Residencial Montes Claros","Jardim Helvécia Aparecida",
    "Setor Industrial Aparecida","Jardim São Luís Aparecida",
    "Parque das Laranjeiras Aparecida","Vila Canaã Aparecida",
    "Parque São Mateus Aparecida","Conjunto Cruzeiro do Sul Aparecida",
    "Setor Perim Aparecida","Bairro Feliz Aparecida","Vila Redenção Aparecida",
    "Jardim São Gonçalo Aparecida","Residencial Buena Vista Aparecida norte",
    "Parque Tremendão Aparecida","Setor dos Afonsos Aparecida",
    "Vila Mutirão Aparecida norte","Jardim Fonte Nova Aparecida",
    // Common simplified names
    "Parque Anhanguera","Vila Brasília","Setor Industrial",
  ],
  "4ª Zona Aparecida": [
    "Residencial Eldorado Aparecida","Setor Santa Luzia Aparecida",
    "Jardim Novo Horizonte Aparecida","Jardim Planalto Aparecida",
    "Residencial Buena Vista Aparecida","Parque Tremendão Aparecida sul",
    "Setor Morada do Sol Aparecida","Jardim Cerrado Aparecida",
    "Vila Mutirão Aparecida","Residencial Coimbra Aparecida",
    "Parque Industrial Aparecida","Conjunto Vera Cruz Aparecida",
    "Jardim Curitiba Aparecida","Residencial Flamboyant Aparecida",
    "Jardim Morumbi Aparecida","Residencial Araguaia Aparecida",
    "Setor Recanto do Bosque Aparecida","Residencial Três Marias Aparecida",
    "Jardim Marcelino Aparecida","Parque Esplanada Aparecida",
    // Common simplified names
    "Residencial Eldorado","Jardim Novo Horizonte","Jardim Planalto",
    "Jardim Cerrado","Vila Mutirão",
  ],
};

// ── Zone centroids for coordinate fallback ──
const GOIANIA_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "1ª":   { lat: -16.6864, lng: -49.2553 },
  "2ª":   { lat: -16.6720, lng: -49.2501 },
  "127ª": { lat: -16.7198, lng: -49.2695 },
  "133ª": { lat: -16.6953, lng: -49.2254 },
  "134ª": { lat: -16.7201, lng: -49.2948 },
  "135ª": { lat: -16.6598, lng: -49.2198 },
  "136ª": { lat: -16.7482, lng: -49.2683 },
  "146ª": { lat: -16.6451, lng: -49.2601 },
  "147ª": { lat: -16.7003, lng: -49.2849 },
};

const APARECIDA_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "1ª Zona Aparecida": { lat: -16.7521, lng: -49.2488 },
  "2ª Zona Aparecida": { lat: -16.7612, lng: -49.2601 },
  "3ª Zona Aparecida": { lat: -16.7698, lng: -49.2712 },
  "4ª Zona Aparecida": { lat: -16.7789, lng: -49.2834 },
};

// ── Zone sets ──
const GOIANIA_ZONE_SET = new Set(ZONAS_ELEITORAIS.map((z) => z.zona));
const APARECIDA_ZONE_SET = new Set(ZONAS_APARECIDA.map((z) => z.zona));
const ALL_ZONES = [...ZONAS_ELEITORAIS, ...ZONAS_APARECIDA];

// ══════════════════════════════════════════════
// CLASSIFICATION TYPES
// ══════════════════════════════════════════════
export type CidadeCategoria = "goiania" | "aparecida" | "interior" | "fora_goias" | "unknown";

export interface ZoneResult {
  zona: string;
  nome: string;
  cor: string;
  eleitores: number;
  method: "database" | "bairro" | "coordinates" | "cidade_fallback" | "unknown";
  categoria: CidadeCategoria;
}

/**
 * Identify zone from available data, with cidade-first classification:
 * 1. Classify by cidade field
 * 2. Within Goiânia: zona_eleitoral → bairro → coordinates
 * 3. Within Aparecida: bairro → coordinates → fallback "zona não identificada"
 * 4. Other Goiás city: display cidade name
 * 5. Outside Goiás: "Fora de Goiás"
 */
export function identifyZone(params: {
  zona_eleitoral?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ZoneResult {
  const { zona_eleitoral, bairro, cidade, estado, latitude, longitude } = params;
  const cidadeNorm = cidade ? normalize(cidade) : "";
  const estadoNorm = estado ? normalize(estado) : "";

  // ── STEP 1: Goiânia ──
  if (cidadeNorm === "goiania" || cidadeNorm.includes("goiania")) {
    return identifyGoianiaZone({ zona_eleitoral, bairro, latitude, longitude });
  }

  // ── STEP 2: Aparecida de Goiânia ──
  if (cidadeNorm === "aparecida de goiania" || cidadeNorm.includes("aparecida de goian")) {
    return identifyAparecidaZone({ bairro, latitude, longitude });
  }

  // ── STEP 3: Other Goiás city ──
  if (cidadeNorm && (estadoNorm === "goias" || estadoNorm === "go" || estadoNorm.includes("goias"))) {
    return {
      zona: cidade!,
      nome: cidade!,
      cor: "#9CA3AF",
      eleitores: 0,
      method: "cidade_fallback",
      categoria: "interior",
    };
  }

  // ── STEP 4: Has cidade but not Goiás ──
  if (cidadeNorm && estadoNorm && estadoNorm !== "goias" && estadoNorm !== "go") {
    return {
      zona: `${cidade}, ${estado}`,
      nome: cidade!,
      cor: "#6B7280",
      eleitores: 0,
      method: "cidade_fallback",
      categoria: "fora_goias",
    };
  }

  // ── STEP 5: No cidade — try zona_eleitoral or coordinates ──
  if (zona_eleitoral && zona_eleitoral.trim() && zona_eleitoral !== "Não identificada") {
    // Check if it's a known Goiânia zone
    const gzMatch = ZONAS_ELEITORAIS.find((z) => z.zona === zona_eleitoral);
    if (gzMatch) {
      return { zona: gzMatch.zona, nome: gzMatch.nome, cor: gzMatch.cor, eleitores: gzMatch.eleitores, method: "database" as const, categoria: "goiania" as const };
    }
    // Check if it's a known Aparecida zone
    const azMatch = ZONAS_APARECIDA.find((z) => z.zona === zona_eleitoral);
    if (azMatch) {
      return { zona: azMatch.zona, nome: azMatch.nome, cor: azMatch.cor, eleitores: azMatch.eleitores, method: "database" as const, categoria: "aparecida" as const };
    }
  }

  // Try coordinates
  if (latitude && longitude) {
    const goianiaResult = findNearestZone(latitude, longitude, GOIANIA_CENTROIDS, 12);
    if (goianiaResult) {
      const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === goianiaResult);
      if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates" as const, categoria: "goiania" as const };
    }
    const aparecidaResult = findNearestZone(latitude, longitude, APARECIDA_CENTROIDS, 10);
    if (aparecidaResult) {
      const z = ZONAS_APARECIDA.find((zz) => zz.zona === aparecidaResult);
      if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates" as const, categoria: "aparecida" as const };
    }
  }

  // If we have a cidade but no estado
  if (cidadeNorm) {
    return {
      zona: cidade!,
      nome: cidade!,
      cor: "#9CA3AF",
      eleitores: 0,
      method: "cidade_fallback",
      categoria: "interior",
    };
  }

  return { zona: "Não identificada", nome: "", cor: "#6B7280", eleitores: 0, method: "unknown", categoria: "unknown" };
}

// ── Goiânia zone identification ──
function identifyGoianiaZone(params: {
  zona_eleitoral?: string | null;
  bairro?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ZoneResult {
  const { zona_eleitoral, bairro, latitude, longitude } = params;

  // 1. Direct from database
  if (zona_eleitoral && zona_eleitoral.trim() && zona_eleitoral !== "Não identificada") {
    const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === zona_eleitoral);
    if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "database" as const, categoria: "goiania" as const };
  }

  // 2. Bairro matching
  if (bairro && bairro.trim()) {
    const normalizedBairro = normalize(bairro);
    for (const [zona, neighborhoods] of Object.entries(GOIANIA_ZONE_NEIGHBORHOODS)) {
      if (neighborhoods.some((n) => normalize(n) === normalizedBairro)) {
        const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === zona);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "bairro" as const, categoria: "goiania" as const };
      }
    }
  }

  // 3. Coordinates
  if (latitude && longitude) {
    const nearest = findNearestZone(latitude, longitude, GOIANIA_CENTROIDS, 15);
    if (nearest) {
      const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === nearest);
      if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates" as const, categoria: "goiania" as const };
    }
  }

  // Fallback: Goiânia but zone not identified
  return { zona: "Goiânia — Zona não identificada", nome: "", cor: "#E8825C", eleitores: 0, method: "unknown", categoria: "goiania" };
}

// ── Aparecida zone identification ──
function identifyAparecidaZone(params: {
  bairro?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ZoneResult {
  const { bairro, latitude, longitude } = params;

  // 1. Bairro matching
  if (bairro && bairro.trim()) {
    const normalizedBairro = normalize(bairro);
    for (const [zona, neighborhoods] of Object.entries(APARECIDA_ZONE_NEIGHBORHOODS)) {
      if (neighborhoods.some((n) => normalize(n) === normalizedBairro)) {
        const z = ZONAS_APARECIDA.find((zz) => zz.zona === zona);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "bairro" as const, categoria: "aparecida" as const };
      }
    }
  }

  // 2. Coordinates
  if (latitude && longitude) {
    const nearest = findNearestZone(latitude, longitude, APARECIDA_CENTROIDS, 10);
    if (nearest) {
      const z = ZONAS_APARECIDA.find((zz) => zz.zona === nearest);
      if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates" as const, categoria: "aparecida" as const };
    }
  }

  // Fallback
  return { zona: "Aparecida de Goiânia — Zona não identificada", nome: "", cor: "#9333EA", eleitores: 0, method: "unknown", categoria: "aparecida" };
}

// ── Find nearest zone by coordinates ──
function findNearestZone(lat: number, lng: number, centroids: Record<string, { lat: number; lng: number }>, maxDistKm: number): string | null {
  let minDist = Infinity;
  let closest = "";
  for (const [zona, centroid] of Object.entries(centroids)) {
    const dist = haversineDistance(lat, lng, centroid.lat, centroid.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = zona;
    }
  }
  return minDist < maxDistKm && closest ? closest : null;
}

// ══════════════════════════════════════════════
// LOCATION PRECISION
// ══════════════════════════════════════════════
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

// ══════════════════════════════════════════════
// HELPER: Classify any record
// ══════════════════════════════════════════════
export function classifyRecord(r: {
  zona_eleitoral?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ZoneResult {
  return identifyZone(r);
}
