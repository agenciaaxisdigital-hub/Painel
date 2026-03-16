// ============ ZONAS ELEITORAIS GOIÂNIA ============
export const ZONAS_ELEITORAIS = [
  { zona: "1ª", nome: "Setor Bueno / Marista / Jardim Goiás", eleitores: 132598, cor: "#E8825C" },
  { zona: "2ª", nome: "Centro / Norte Ferroviário / Vila Nova", eleitores: 114960, cor: "#7BB5E0" },
  { zona: "127ª", nome: "Jardim Presidente / Pedro Ludovico Sul", eleitores: 154000, cor: "#E8D44D" },
  { zona: "133ª", nome: "Faiçalville / Jardim Atlântico", eleitores: 134028, cor: "#E8A84D" },
  { zona: "134ª", nome: "Vila Mutirão / Jardim Curitiba", eleitores: 159000, cor: "#A8D44D" },
  { zona: "135ª", nome: "Jardim Europa / Vale dos Sonhos", eleitores: 120000, cor: "#B88CE0" },
  { zona: "136ª", nome: "Setor Perim / Goiânia 2", eleitores: 140000, cor: "#4D5BB8" },
  { zona: "146ª", nome: "Santa Genoveva / Parque Atheneu", eleitores: 114000, cor: "#4DB86B" },
  { zona: "147ª", nome: "Caiçara / Morada do Sol", eleitores: 118000, cor: "#4DB8D4" },
] as const;

export const TOTAL_ELEITORES_GOIANIA = 1_036_218;

// ============ ZONAS ELEITORAIS APARECIDA DE GOIÂNIA ============
export const ZONAS_APARECIDA = [
  { zona: "119ª", nome: "Centro / Cidade Livre / Jardim Riviera", eleitores: 135000, cor: "#FF6B8A" },
  { zona: "132ª", nome: "American Park / Cardoso / Independência", eleitores: 142000, cor: "#FFB347" },
  { zona: "145ª", nome: "Garavelo / Papillon / Jardim Luz", eleitores: 128000, cor: "#7EC8E3" },
] as const;

export const TOTAL_ELEITORES_APARECIDA = 405_000;

export const ZONE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  [...ZONAS_ELEITORAIS, ...ZONAS_APARECIDA].map((z) => [z.zona, z.cor])
);

// ============ REGIÕES DE PLANEJAMENTO GOIÁS ============
export const REGIOES_GOIAS = [
  { nome: "Metropolitana de Goiânia", cor: "#8B1A1A" },
  { nome: "Entorno do Distrito Federal", cor: "#C44D34" },
  { nome: "Centro Goiano", cor: "#E8914A" },
  { nome: "Norte Goiano", cor: "#7BC47F" },
  { nome: "Noroeste Goiano", cor: "#B8D468" },
  { nome: "Oeste Goiano", cor: "#6BC4A6" },
  { nome: "Sudeste Goiano", cor: "#5BBFBF" },
  { nome: "Sul Goiano", cor: "#3DA8A8" },
] as const;

// ============ PLATFORM COLORS ============
export const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "hsl(142, 71%, 45%)",
  instagram: "hsl(341, 90%, 65%)",
  facebook: "hsl(220, 70%, 55%)",
};

export const DEVICE_COLORS: Record<string, string> = {
  mobile: "hsl(341, 90%, 65%)",
  desktop: "hsl(45, 93%, 47%)",
  tablet: "hsl(240, 5%, 64%)",
};

// ============ EMPTY STATE MESSAGE ============
export const EMPTY_STATE_MESSAGE = "Aguardando dados do Site Principal. As informações aparecerão aqui assim que os primeiros visitantes acessarem o site.";