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
// All names are UNIQUE to Aparecida — no overlap with Goiânia
// The cidade field already guarantees separation; these are for zone matching within Aparecida
// ══════════════════════════════════════════════
const APARECIDA_ZONE_BAIRROS: Record<string, string[]> = {
  "1ª Zona Aparecida": [
    // Exact bairro names as they appear in the database
    "centro", "setor garavelo", "garavelo", "garavelo park", "jardim primavera",
    "setor expansao", "expansao", "vila brasilia", "setor ataide", "ataíde",
    "setor dos funcionarios", "vila santa helena", "parque das acacias",
    "jardim belvedere", "belvedere", "setor bueno", "vila rossi", "jardim copacabana",
    "copacabana", "setor nova vila", "jardim america", "vila esperanca",
    "residencial santa fe", "santa fe", "laranjeiras norte", "guanabara norte",
    "jardim novo mundo", "setor bela vista", "residencial vila brasilia",
  ],
  "2ª Zona Aparecida": [
    "jardim tiradentes", "tiradentes", "setor conde dos arcos", "conde dos arcos",
    "setor conde", "parque trindade", "trindade", "residencial vale verde", "vale verde",
    "parque flamboyant", "jardim dom fernando", "dom fernando",
    "residencial interlagos", "interlagos", "jardim florenca", "florenca",
    "vila sao tomas", "sao tomas", "jardim olimpico", "olimpico",
    "residencial independencia", "independencia", "jardim guanabara",
    "jardim planalto", "planalto", "setor morada do sol",
    "residencial coimbra", "setor santa luzia", "santa luzia",
    "jardim novo horizonte", "buena vista norte", "riviera", "conjunto riviera",
    "jardim dom fernando ii",
  ],
  "3ª Zona Aparecida": [
    "parque anhanguera", "anhanguera", "residencial montes claros", "montes claros",
    "jardim helveica", "jardim helvecia", "helveica", "helvecia",
    "setor industrial", "industrial", "jardim sao luis", "sao luis",
    "vila canaa", "canaa", "parque sao mateus", "sao mateus",
    "conjunto cruzeiro do sul", "cruzeiro do sul", "cruzeiro",
    "setor perim", "perim", "bairro feliz", "feliz",
    "vila redencao", "redencao", "jardim sao goncalo", "sao goncalo",
    "jardim fonte nova", "fonte nova", "setor dos afonsos", "afonsos",
    "vila mutirao norte", "mutirao norte", "parque das laranjeiras", "laranjeiras",
    "vila brasilia aparecida", "setor vila brasilia",
  ],
  "4ª Zona Aparecida": [
    "residencial eldorado", "eldorado", "jardim novo horizonte", "novo horizonte",
    "residencial buena vista", "buena vista", "parque tremendao", "tremendao",
    "setor morada do sol", "morada do sol", "jardim cerrado", "cerrado",
    "vila mutirao", "mutirao", "residencial coimbra", "coimbra",
    "parque industrial", "conjunto vera cruz", "vera cruz",
    "jardim curitiba", "curitiba", "jardim morumbi", "morumbi",
    "residencial araguaia", "araguaia", "setor recanto do bosque", "recanto do bosque",
    "residencial tres marias", "tres marias", "jardim marcelino", "marcelino",
    "parque esplanada", "esplanada", "setor luzio veiga", "luzio",
    "conjunto baliza", "baliza", "jardim sao joaquim", "sao joaquim",
    "residencial barravento", "barravento", "residencial botanico", "botanico",
    "jardim vitoria", "vitoria", "parque atheneu", "atheneu",
    "jardim planalto sul", "planalto sul", "residencial flamboyant",
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

// ── Geographic boundaries for city classification by coordinates ──
// Aparecida is SOUTH of Goiânia — roughly lat < -16.73 and within lng range
const APARECIDA_BOUNDS = { latMin: -16.85, latMax: -16.73, lngMin: -49.38, lngMax: -49.18 };
const GOIANIA_BOUNDS = { latMin: -16.76, latMax: -16.58, lngMin: -49.40, lngMax: -49.15 };

function isInBounds(lat: number, lng: number, bounds: typeof APARECIDA_BOUNDS): boolean {
  return lat >= bounds.latMin && lat <= bounds.latMax && lng >= bounds.lngMin && lng <= bounds.lngMax;
}

// ── Zone sets ──
const GOIANIA_ZONE_SET = new Set(ZONAS_ELEITORAIS.map((z) => z.zona));
const APARECIDA_ZONE_SET = new Set(ZONAS_APARECIDA.map((z) => z.zona));

// ══════════════════════════════════════════════
// CITY CLASSIFICATION — THE FIRST AND MOST CRITICAL STEP
// This determines which zone identification runs.
// ══════════════════════════════════════════════

function inferCategoriaFromZonaEleitoral(zonaEleitoral?: string | null): "goiania" | "aparecida" | "unknown" {
  if (!zonaEleitoral || !zonaEleitoral.trim()) return "unknown";
  const zn = normalize(zonaEleitoral);

  if (
    zn.includes("ap_zona_") ||
    (zn.includes("aparecida") && (zn.includes("1") || zn.includes("2") || zn.includes("3") || zn.includes("4"))) ||
    ZONAS_APARECIDA.some((z) => normalize(z.zona) === zn)
  ) {
    return "aparecida";
  }

  if (ZONAS_ELEITORAIS.some((z) => normalize(z.zona) === zn)) {
    return "goiania";
  }

  return "unknown";
}

function classifyCidade(cidade?: string | null, estado?: string | null, lat?: number | null, lng?: number | null): "goiania" | "aparecida" | "interior" | "fora_goias" | "unknown" {
  const cn = cidade ? normalize(cidade) : "";
  const en = estado ? normalize(estado) : "";

  if (cn) {
    if (cn === "aparecida de goiania" || (cn.includes("aparecida") && cn.includes("goian"))) {
      return "aparecida";
    }
    if (cn === "goiania") {
      return "goiania";
    }
    if (en === "go" || en === "goias" || en.includes("goias")) {
      return "interior";
    }
    if (en && en !== "go" && en !== "goias" && !en.includes("goias")) {
      return "fora_goias";
    }
    return "interior";
  }

  if (lat && lng) {
    const inAparecida = isInBounds(lat, lng, APARECIDA_BOUNDS);
    const inGoiania = isInBounds(lat, lng, GOIANIA_BOUNDS);

    if (inAparecida && !inGoiania) return "aparecida";
    if (inGoiania && !inAparecida) return "goiania";

    // Área de sobreposição = ambígua. Melhor não classificar do que poluir os dados.
    if (inAparecida && inGoiania) return "unknown";
  }

  return "unknown";
}

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
 * Identify zone with strict anti-pollution classification:
 * 1. cidade exacta decide a cidade
 * 2. se cidade faltar, tenta zona_eleitoral explícita
 * 3. coordenadas só classificam quando caem fora da área ambígua
 * 4. se ainda houver dúvida, cai em unknown em vez de misturar Goiânia/Aparecida
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

  const cityCategoria = classifyCidade(cidade, estado, latitude, longitude);
  const zonaCategoria = inferCategoriaFromZonaEleitoral(zona_eleitoral);
  const categoria = cityCategoria !== "unknown" ? cityCategoria : zonaCategoria;

  switch (categoria) {
    case "goiania":
      return identifyGoianiaZone({ zona_eleitoral, bairro, latitude, longitude });
    case "aparecida":
      return identifyAparecidaZone({ zona_eleitoral, bairro, latitude, longitude });
    case "interior":
      return {
        zona: cidade!,
        nome: cidade!,
        cor: "#9CA3AF",
        eleitores: 0,
        method: "cidade_fallback",
        categoria: "interior",
      };
    case "fora_goias":
      return {
        zona: `${cidade}, ${estado}`,
        nome: cidade!,
        cor: "#6B7280",
        eleitores: 0,
        method: "cidade_fallback",
        categoria: "fora_goias",
      };
    default:
      break;
  }

  if (latitude && longitude) {
    const inAparecida = isInBounds(latitude, longitude, APARECIDA_BOUNDS);
    const inGoiania = isInBounds(latitude, longitude, GOIANIA_BOUNDS);

    if (inGoiania && !inAparecida) {
      const goianiaResult = findNearestZone(latitude, longitude, GOIANIA_CENTROIDS, 12);
      if (goianiaResult) {
        const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === goianiaResult);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates", categoria: "goiania" };
      }
    }

    if (inAparecida && !inGoiania) {
      const aparecidaResult = findNearestZone(latitude, longitude, APARECIDA_CENTROIDS, 10);
      if (aparecidaResult) {
        const z = ZONAS_APARECIDA.find((zz) => zz.zona === aparecidaResult);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates", categoria: "aparecida" };
      }
    }
  }

  if (cidade && (estado ? normalize(estado).includes("go") : true)) {
    return { zona: cidade, nome: cidade, cor: "#9CA3AF", eleitores: 0, method: "cidade_fallback", categoria: "interior" };
  }

  return { zona: "Sem localização", nome: "", cor: "#6B7280", eleitores: 0, method: "unknown", categoria: "unknown" };
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
    if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "database", categoria: "goiania" };
  }

  // 2. Bairro matching — two-pass: exact first, then includes
  if (bairro && bairro.trim()) {
    const nb = normalize(bairro);
    // Pass 1: exact match
    for (const [zona, neighborhoods] of Object.entries(GOIANIA_ZONE_NEIGHBORHOODS)) {
      if (neighborhoods.some((n) => normalize(n) === nb)) {
        const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === zona);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "bairro", categoria: "goiania" };
      }
    }
    // Pass 2: includes (only if no exact match)
    for (const [zona, neighborhoods] of Object.entries(GOIANIA_ZONE_NEIGHBORHOODS)) {
      if (neighborhoods.some((n) => {
        const nn = normalize(n);
        return (nn.length >= 6 && nb.includes(nn)) || (nb.length >= 6 && nn.includes(nb));
      })) {
        const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === zona);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "bairro", categoria: "goiania" };
      }
    }
  }

  // 3. Coordinates
  if (latitude && longitude) {
    const nearest = findNearestZone(latitude, longitude, GOIANIA_CENTROIDS, 15);
    if (nearest) {
      const z = ZONAS_ELEITORAIS.find((zz) => zz.zona === nearest);
      if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates", categoria: "goiania" };
    }
  }

  // Fallback: Goiânia but zone not identified — use 136ª (largest coverage)
  const fallback = ZONAS_ELEITORAIS.find((z) => z.zona === "136ª") || ZONAS_ELEITORAIS[0];
  return { zona: fallback.zona, nome: fallback.nome, cor: fallback.cor, eleitores: fallback.eleitores, method: "unknown", categoria: "goiania" };
}

// ── Aparecida zone identification ──
function identifyAparecidaZone(params: {
  zona_eleitoral?: string | null;
  bairro?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ZoneResult {
  const { zona_eleitoral, bairro, latitude, longitude } = params;

  // 1. Direct from database zona_eleitoral
  if (zona_eleitoral && zona_eleitoral.trim()) {
    const z_lower = zona_eleitoral.toLowerCase();
    if (z_lower.includes("ap_zona_1") || (z_lower.includes("1") && z_lower.includes("aparecida"))) {
      const z = ZONAS_APARECIDA[0];
      return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "database", categoria: "aparecida" };
    }
    if (z_lower.includes("ap_zona_2") || (z_lower.includes("2") && z_lower.includes("aparecida"))) {
      const z = ZONAS_APARECIDA[1];
      return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "database", categoria: "aparecida" };
    }
    if (z_lower.includes("ap_zona_3") || (z_lower.includes("3") && z_lower.includes("aparecida"))) {
      const z = ZONAS_APARECIDA[2];
      return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "database", categoria: "aparecida" };
    }
    if (z_lower.includes("ap_zona_4") || (z_lower.includes("4") && z_lower.includes("aparecida"))) {
      const z = ZONAS_APARECIDA[3];
      return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "database", categoria: "aparecida" };
    }
    // Check exact match
    const azMatch = ZONAS_APARECIDA.find((z) => z.zona === zona_eleitoral);
    if (azMatch) return { zona: azMatch.zona, nome: azMatch.nome, cor: azMatch.cor, eleitores: azMatch.eleitores, method: "database", categoria: "aparecida" };
  }

  // 2. Bairro matching — normalized keywords, two-pass
  if (bairro && bairro.trim()) {
    const nb = normalize(bairro);
    // Pass 1: exact match against keyword list
    for (const [zona, keywords] of Object.entries(APARECIDA_ZONE_BAIRROS)) {
      if (keywords.some((k) => k === nb)) {
        const z = ZONAS_APARECIDA.find((zz) => zz.zona === zona);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "bairro", categoria: "aparecida" };
      }
    }
    // Pass 2: includes (only keywords >= 5 chars to avoid false matches)
    for (const [zona, keywords] of Object.entries(APARECIDA_ZONE_BAIRROS)) {
      if (keywords.some((k) => k.length >= 5 && (nb.includes(k) || k.includes(nb)))) {
        const z = ZONAS_APARECIDA.find((zz) => zz.zona === zona);
        if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "bairro", categoria: "aparecida" };
      }
    }
  }

  // 3. Coordinates
  if (latitude && longitude) {
    const nearest = findNearestZone(latitude, longitude, APARECIDA_CENTROIDS, 10);
    if (nearest) {
      const z = ZONAS_APARECIDA.find((zz) => zz.zona === nearest);
      if (z) return { zona: z.zona, nome: z.nome, cor: z.cor, eleitores: z.eleitores, method: "coordinates", categoria: "aparecida" };
    }
  }

  // Fallback — default to 4ª Zona Aparecida (largest zone)
  const fallbackZone = ZONAS_APARECIDA[3];
  return { zona: fallbackZone.zona, nome: fallbackZone.nome, cor: fallbackZone.cor, eleitores: fallbackZone.eleitores, method: "unknown", categoria: "aparecida" };
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
