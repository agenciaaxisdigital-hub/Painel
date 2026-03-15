import { subDays, format, subHours, subMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

// ============ GOIÁS REGIONS ============
export const regioesGoias = [
  { nome: "Metropolitana de Goiânia", cor: "#8B1A1A", municipios: ["Goiânia", "Aparecida de Goiânia", "Senador Canedo", "Trindade", "Goianira", "Nerópolis", "Inhumas", "Anápolis", "Bela Vista de Goiás", "Hidrolândia", "Bonfinópolis", "Caldazinha", "Caturaí", "Terezópolis de Goiás", "Nova Veneza", "Brazabrantes", "Santo Antônio de Goiás", "Abadia de Goiás", "Aragoiânia", "Guapó"], visitantes: 4520, formularios: 312, cliquesWhatsapp: 890, cliquesInstagram: 654, penetracao: 2.8 },
  { nome: "Entorno do Distrito Federal", cor: "#C44D34", municipios: ["Valparaíso de Goiás", "Luziânia", "Águas Lindas de Goiás", "Novo Gama", "Planaltina", "Formosa", "Cristalina", "Santo Antônio do Descoberto", "Cidade Ocidental", "Padre Bernardo"], visitantes: 1890, formularios: 134, cliquesWhatsapp: 445, cliquesInstagram: 312, penetracao: 1.2 },
  { nome: "Centro Goiano", cor: "#E8914A", municipios: ["Jaraguá", "Ceres", "Goianésia", "Rialma", "Rubiataba", "Itapuranga", "Uruana", "Itapaci", "Carmo do Rio Verde", "São Luís de Montes Belos"], visitantes: 980, formularios: 67, cliquesWhatsapp: 210, cliquesInstagram: 156, penetracao: 0.8 },
  { nome: "Norte Goiano", cor: "#7BC47F", municipios: ["Porangatu", "Uruaçu", "Niquelândia", "São Miguel do Araguaia", "Minaçu", "Campos Belos", "Cavalcante", "Alto Paraíso de Goiás", "Colinas do Sul", "Santa Terezinha de Goiás"], visitantes: 560, formularios: 34, cliquesWhatsapp: 120, cliquesInstagram: 89, penetracao: 0.5 },
  { nome: "Noroeste Goiano", cor: "#B8D468", municipios: ["Goiás", "Mozarlândia", "Araguapaz", "Aruanã", "Faina", "Matrinchã", "Britânia", "Itapirapuã", "Jussara", "Santa Fé de Goiás"], visitantes: 340, formularios: 22, cliquesWhatsapp: 78, cliquesInstagram: 45, penetracao: 0.3 },
  { nome: "Oeste Goiano", cor: "#6BC4A6", municipios: ["Iporá", "Israelândia", "Arenópolis", "Piranhas", "Doverlândia", "Caiapônia", "Palestina de Goiás", "Moiporá", "Diorama", "Jaupaci"], visitantes: 420, formularios: 28, cliquesWhatsapp: 95, cliquesInstagram: 67, penetracao: 0.4 },
  { nome: "Sudeste Goiano", cor: "#5BBFBF", municipios: ["Catalão", "Pires do Rio", "Caldas Novas", "Ipameri", "Morrinhos", "Goiatuba", "Itumbiara", "Pontalina", "Buriti Alegre", "Corumbaíba"], visitantes: 870, formularios: 56, cliquesWhatsapp: 190, cliquesInstagram: 134, penetracao: 0.7 },
  { nome: "Sul Goiano", cor: "#3DA8A8", municipios: ["Rio Verde", "Jataí", "Mineiros", "Quirinópolis", "Santa Helena de Goiás", "Acreúna", "Paraúna", "Montividiu", "Indiara", "Edéia"], visitantes: 750, formularios: 48, cliquesWhatsapp: 165, cliquesInstagram: 112, penetracao: 0.6 },
];

// ============ ZONAS ELEITORAIS GOIÂNIA ============
export const zonasEleitorais = [
  { zona: "1ª", eleitores: 132598, cor: "#E8825C", bairros: ["Setor Leste Universitário", "Setor Leste Vila Nova", "Vila Nova", "Setor Universitário", "Setor Bueno", "Setor Marista", "Jardim Goiás", "Parque Amazônia", "Setor Pedro Ludovico"], visitantes: 645, formularios: 48, cliquesWhatsapp: 134, cliquesInstagram: 98, penetracao: 0.49 },
  { zona: "2ª", eleitores: 114960, cor: "#7BB5E0", bairros: ["Setor Central", "Setor Oeste", "Setor Aeroporto", "Setor Norte Ferroviário", "Campinas", "Setor Coimbra", "Setor Sul", "Vila Maria José", "Setor dos Funcionários"], visitantes: 534, formularios: 41, cliquesWhatsapp: 112, cliquesInstagram: 87, penetracao: 0.46 },
  { zona: "127ª", eleitores: 154000, cor: "#E8D44D", bairros: ["Jardim América", "Setor Bela Vista", "Vila Redenção", "Setor Gentil Meireles", "Vila Canaã", "Parque Anhanguera", "Residencial Eldorado", "Vila Brasília", "Jardim Vila Boa"], visitantes: 712, formularios: 55, cliquesWhatsapp: 156, cliquesInstagram: 118, penetracao: 0.46 },
  { zona: "133ª", eleitores: 134028, cor: "#E8A84D", bairros: ["Jardim Novo Mundo", "Vila Jaiara", "Jardim Guanabara", "Vila Santa Helena", "Parque Atheneu", "Setor Urias Magalhães", "Conjunto Riviera", "Parque das Laranjeiras", "Vila Maria Dilce"], visitantes: 589, formularios: 43, cliquesWhatsapp: 128, cliquesInstagram: 95, penetracao: 0.44 },
  { zona: "134ª", eleitores: 159000, cor: "#A8D44D", bairros: ["Jardim Curitiba", "Setor Cândida de Morais", "Residencial Itaipu", "Jardim Balneário Meia Ponte", "Vila Mutirão", "Jardim Mariliza", "Conjunto Vera Cruz", "Parque Industrial João Braz", "Setor Garavelo"], visitantes: 498, formularios: 32, cliquesWhatsapp: 98, cliquesInstagram: 72, penetracao: 0.31 },
  { zona: "135ª", eleitores: 120000, cor: "#B88CE0", bairros: ["Parque Amazônia", "Jardim Europa", "Cidade Jardim", "Vila Pedroso", "Jardim Shangri-lá", "Setor Faiçalville", "Parque Santa Rita", "Vila Redenção", "Chácara do Governador"], visitantes: 478, formularios: 35, cliquesWhatsapp: 105, cliquesInstagram: 79, penetracao: 0.40 },
  { zona: "136ª", eleitores: 140000, cor: "#4D5BB8", bairros: ["Jardim Novo Mundo", "Parque Flamboyant", "Jardim Pompeia", "Vila Morais", "Setor Morada do Sol", "Jardim Planalto", "Parque Amazônia", "Vila Alpes", "Residencial Granville"], visitantes: 556, formularios: 42, cliquesWhatsapp: 122, cliquesInstagram: 91, penetracao: 0.40 },
  { zona: "146ª", eleitores: 114000, cor: "#4DB86B", bairros: ["Jardim Guanabara", "Vila São José", "Setor Urias Magalhães", "Jardim Planalto", "Vila Redenção", "Setor Goiânia 2", "Parque das Laranjeiras", "Conjunto Riviera", "Vila Maria Dilce"], visitantes: 412, formularios: 29, cliquesWhatsapp: 87, cliquesInstagram: 63, penetracao: 0.36 },
  { zona: "147ª", eleitores: 118000, cor: "#4DB8D4", bairros: ["Setor Goiânia 2", "Jardim Novo Planalto", "Vila Santa Helena", "Parque Tremendão", "Setor Grajaú", "Residencial Center Ville", "Vila Monticelli", "Jardim Curitiba III", "Setor Recanto das Minas Gerais"], visitantes: 389, formularios: 27, cliquesWhatsapp: 81, cliquesInstagram: 58, penetracao: 0.33 },
];

export const totalEleitoresGoiania = 1036218;

// ============ TIME SERIES DATA ============
export function generateTimeSeriesData(days = 30) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const base = 80 + Math.floor(Math.random() * 120);
    data.push({
      date: format(date, "dd/MM", { locale: ptBR }),
      dateISO: format(date, "yyyy-MM-dd"),
      visitantes: base + Math.floor(Math.random() * 60),
      formularios: Math.floor(base * 0.08 + Math.random() * 8),
      cliquesWhatsapp: Math.floor(base * 0.15 + Math.random() * 15),
      cliquesInstagram: Math.floor(base * 0.12 + Math.random() * 12),
    });
  }
  return data;
}

// ============ KPI DATA ============
export const kpiData = {
  totalVisitantes: { valor: 10330, variacao: 12.5, sparkline: [65, 78, 82, 90, 95, 88, 102, 110, 98, 115, 120, 130] },
  novosEleitores: { valor: 652, variacao: 8.3, sparkline: [12, 15, 18, 14, 22, 19, 25, 20, 28, 24, 30, 32] },
  cliquesWhatsapp: { valor: 2390, variacao: 15.2, sparkline: [35, 42, 38, 55, 48, 62, 58, 70, 65, 78, 82, 90] },
  cliquesInstagram: { valor: 1667, variacao: -3.1, sparkline: [30, 35, 28, 40, 32, 45, 38, 42, 35, 48, 40, 38] },
  taxaConversao: { valor: 6.31, variacao: 2.1, sparkline: [5.2, 5.8, 6.0, 5.5, 6.2, 5.9, 6.5, 6.1, 6.8, 6.3, 7.0, 6.3] },
  visitantesAgora: { valor: 23, variacao: 0, sparkline: [15, 18, 22, 19, 25, 20, 28, 23, 30, 25, 22, 23] },
};

// ============ DEVICE DATA ============
export const deviceData = [
  { name: "Mobile", value: 68, fill: "hsl(341, 90%, 65%)" },
  { name: "Desktop", value: 27, fill: "hsl(45, 93%, 47%)" },
  { name: "Tablet", value: 5, fill: "hsl(240, 5%, 64%)" },
];

// ============ TRAFFIC ORIGIN ============
export const trafficData = [
  { name: "Instagram", value: 35, fill: "hsl(341, 90%, 65%)" },
  { name: "WhatsApp", value: 28, fill: "hsl(142, 71%, 45%)" },
  { name: "Google", value: 20, fill: "hsl(45, 93%, 47%)" },
  { name: "Direto", value: 12, fill: "hsl(200, 70%, 55%)" },
  { name: "Outros", value: 5, fill: "hsl(240, 5%, 64%)" },
];

// ============ TOP PAGES ============
export const topPagesData = [
  { pagina: "/", visitas: 4520 },
  { pagina: "/propostas", visitas: 2340 },
  { pagina: "/sobre", visitas: 1890 },
  { pagina: "/galeria", visitas: 1230 },
  { pagina: "/contato", visitas: 980 },
  { pagina: "/agenda", visitas: 670 },
];

// ============ ACTIVITY FEED ============
const acoes = ["visitou o site", "preencheu formulário", "clicou no WhatsApp", "clicou no Instagram"];
const cidades = ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Senador Canedo", "Trindade", "Valparaíso de Goiás", "Rio Verde", "Catalão", "Luziânia", "Formosa", "Caldas Novas", "Jataí", "Itumbiara", "Porangatu", "Inhumas"];
const dispositivos = ["mobile", "desktop", "tablet"] as const;

export function generateActivityFeed(count = 20) {
  return Array.from({ length: count }, (_, i) => {
    const acao = acoes[Math.floor(Math.random() * acoes.length)];
    return {
      id: `evt-${i}`,
      cidade: cidades[Math.floor(Math.random() * cidades.length)],
      estado: "GO",
      dispositivo: dispositivos[Math.floor(Math.random() * dispositivos.length)],
      acao,
      tipo: acao.includes("formulário") ? "formulario" : acao.includes("WhatsApp") ? "whatsapp" : acao.includes("Instagram") ? "instagram" : "visita",
      tempoAtras: formatTempoAtras(subMinutes(new Date(), Math.floor(Math.random() * 120))),
      timestamp: subMinutes(new Date(), Math.floor(Math.random() * 120)),
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function formatTempoAtras(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

// ============ FORM SUBMISSIONS ============
const nomes = ["Maria Silva", "João Santos", "Ana Oliveira", "Pedro Costa", "Lucia Souza", "Carlos Pereira", "Fernanda Lima", "Roberto Alves", "Juliana Rocha", "Marcos Ribeiro", "Patricia Mendes", "André Ferreira", "Camila Araujo", "Diego Nascimento", "Beatriz Gomes"];
const telefones = ["(62) 99812-3456", "(62) 98765-4321", "(62) 99234-5678", "(62) 98456-7890", "(62) 99678-1234"];

export function generateFormSubmissions(count = 50) {
  return Array.from({ length: count }, (_, i) => {
    const zona = zonasEleitorais[Math.floor(Math.random() * zonasEleitorais.length)];
    const bairro = zona.bairros[Math.floor(Math.random() * zona.bairros.length)];
    return {
      id: `form-${i}`,
      nome: nomes[Math.floor(Math.random() * nomes.length)],
      telefone: telefones[Math.floor(Math.random() * telefones.length)],
      email: `contato${i}@email.com`,
      mensagem: "Gostaria de saber mais sobre as propostas para a minha região.",
      cidade: "Goiânia",
      estado: "GO",
      bairro,
      zonaEleitoral: zona.zona,
      dispositivo: dispositivos[Math.floor(Math.random() * dispositivos.length)],
      navegador: ["Chrome", "Safari", "Firefox", "Edge"][Math.floor(Math.random() * 4)],
      sistemaOperacional: ["Android", "iOS", "Windows", "macOS"][Math.floor(Math.random() * 4)],
      latitude: -16.6869 + (Math.random() - 0.5) * 0.1,
      longitude: -49.2648 + (Math.random() - 0.5) * 0.1,
      enderecoIP: `189.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      criadoEm: subHours(new Date(), Math.floor(Math.random() * 720)),
      tempoPreenchimento: 30 + Math.floor(Math.random() * 180),
    };
  }).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
}

// ============ VISITORS ============
export function generateVisitors(count = 100) {
  return Array.from({ length: count }, (_, i) => {
    const zona = zonasEleitorais[Math.floor(Math.random() * zonasEleitorais.length)];
    const cidade = cidades[Math.floor(Math.random() * cidades.length)];
    const totalVisitas = 1 + Math.floor(Math.random() * 30);
    const actions: string[] = [];
    if (Math.random() > 0.7) actions.push("Formulário");
    if (Math.random() > 0.5) actions.push("WhatsApp");
    if (Math.random() > 0.6) actions.push("Instagram");

    // Calculate eleitor score (flames)
    let flames = 1; // visited once
    if (totalVisitas > 1) flames = 2;
    if (actions.includes("Formulário")) flames = 3;
    if (actions.includes("Formulário") && actions.includes("WhatsApp")) flames = 4;

    return {
      id: `vis-${i}`,
      cookieId: `ck_${Math.random().toString(36).substring(2, 10)}`,
      cidade,
      estado: "GO",
      zonaEleitoral: cidade === "Goiânia" ? zona.zona : null,
      bairro: cidade === "Goiânia" ? zona.bairros[0] : null,
      dispositivo: dispositivos[Math.floor(Math.random() * dispositivos.length)],
      navegador: ["Chrome", "Safari", "Firefox"][Math.floor(Math.random() * 3)],
      sistemaOperacional: ["Android", "iOS", "Windows"][Math.floor(Math.random() * 3)],
      totalVisitas,
      tempoTotal: totalVisitas * (60 + Math.floor(Math.random() * 300)),
      primeiraVisita: subDays(new Date(), Math.floor(Math.random() * 90)),
      ultimaVisita: subDays(new Date(), Math.floor(Math.random() * 7)),
      acoes: actions,
      paginasVisitadas: ["/", "/propostas", "/sobre", "/contato"].slice(0, 1 + Math.floor(Math.random() * 3)),
      flames,
      sessions: Array.from({ length: Math.min(totalVisitas, 5) }, (_, j) => ({
        date: subDays(new Date(), j * 2 + Math.floor(Math.random() * 3)),
        pages: ["/", "/propostas", "/sobre"].slice(0, 1 + Math.floor(Math.random() * 2)),
        duration: 30 + Math.floor(Math.random() * 300),
      })),
    };
  });
}

// ============ HOURLY HEATMAP ============
export function generateHourlyHeatmap() {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const data: { dia: string; hora: number; valor: number }[] = [];
  dias.forEach((dia) => {
    for (let h = 0; h < 24; h++) {
      const isPeak = h >= 9 && h <= 21;
      const isWeekend = dia === "Sáb" || dia === "Dom";
      const base = isPeak ? 5 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 5);
      data.push({ dia, hora: h, valor: isWeekend ? Math.floor(base * 0.7) : base });
    }
  });
  return data;
}

// ============ CALENDAR HEATMAP ============
export function generateCalendarHeatmap(days = 90) {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"),
    count: Math.floor(Math.random() * 15),
  }));
}

// ============ ENGAGEMENT CLICK DATA ============
export function generateClickData(count = 80) {
  return Array.from({ length: count }, (_, i) => {
    const zona = zonasEleitorais[Math.floor(Math.random() * zonasEleitorais.length)];
    return {
      id: `clk-${i}`,
      tipo: Math.random() > 0.45 ? "whatsapp" : "instagram",
      cidade: cidades[Math.floor(Math.random() * cidades.length)],
      estado: "GO",
      zonaEleitoral: zona.zona,
      dispositivo: dispositivos[Math.floor(Math.random() * dispositivos.length)],
      criadoEm: subHours(new Date(), Math.floor(Math.random() * 720)),
    };
  }).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
}

// ============ BEHAVIOR DATA ============
export const behaviorData = {
  paginaMaisVisitada: "/propostas",
  tempoMedioPagina: "2m 34s",
  taxaRejeicao: 32.5,
  scrollMedio: 68,
  visitantesRetorno: 3420,
  scrollDepth: [
    { depth: "25%", percentage: 92 },
    { depth: "50%", percentage: 74 },
    { depth: "75%", percentage: 51 },
    { depth: "100%", percentage: 28 },
  ],
};

// ============ ALERTS ============
export function generateAlerts() {
  return [
    { id: "a1", type: "warning" as const, message: "134ª Zona com penetração abaixo de 0.35% — priorizar tráfego pago", time: "há 2h", read: false },
    { id: "a2", type: "success" as const, message: "127ª Zona atingiu marco de 0.46% de penetração", time: "há 5h", read: false },
    { id: "a3", type: "danger" as const, message: "Taxa de conversão caiu para 1.8% nas últimas 24h no Setor Bueno", time: "há 8h", read: true },
    { id: "a4", type: "info" as const, message: "Spike de 250% em acessos do Jardim América — investigar origem", time: "há 12h", read: true },
    { id: "a5", type: "warning" as const, message: "147ª Zona com 3 dias consecutivos de queda de acessos", time: "há 1d", read: true },
  ];
}

// ============ TOP CITIES ============
export const topCities = [
  { cidade: "Goiânia", visitantes: 4520 },
  { cidade: "Aparecida de Goiânia", visitantes: 856 },
  { cidade: "Anápolis", visitantes: 634 },
  { cidade: "Senador Canedo", visitantes: 412 },
  { cidade: "Valparaíso de Goiás", visitantes: 389 },
  { cidade: "Rio Verde", visitantes: 312 },
  { cidade: "Trindade", visitantes: 287 },
  { cidade: "Catalão", visitantes: 245 },
  { cidade: "Luziânia", visitantes: 198 },
  { cidade: "Caldas Novas", visitantes: 176 },
];
