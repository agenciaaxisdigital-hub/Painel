// ============ ZONAS ELEITORAIS GOIÂNIA ============
export const ZONAS_ELEITORAIS = [
  { zona: "1ª", nome: "Setor Bueno / Marista / Jardim Goiás", eleitores: 132598, cor: "#FA8072" },
  { zona: "2ª", nome: "Centro / Norte Ferroviário / Vila Nova", eleitores: 114960, cor: "#87CEEB" },
  { zona: "127ª", nome: "Jardim Presidente / Pedro Ludovico Sul", eleitores: 154000, cor: "#FFD700" },
  { zona: "133ª", nome: "Faiçalville / Jardim Atlântico", eleitores: 134028, cor: "#FFA500" },
  { zona: "134ª", nome: "Vila Mutirão / Jardim Curitiba", eleitores: 159000, cor: "#ADFF2F" },
  { zona: "135ª", nome: "Jardim Europa / Vale dos Sonhos", eleitores: 120000, cor: "#DDA0DD" },
  { zona: "136ª", nome: "Setor Perim / Goiânia 2", eleitores: 140000, cor: "#483D8B" },
  { zona: "146ª", nome: "Santa Genoveva / Parque Atheneu", eleitores: 114000, cor: "#228B22" },
  { zona: "147ª", nome: "Caiçara / Morada do Sol", eleitores: 118000, cor: "#00BFFF" },
] as const;

export const TOTAL_ELEITORES_GOIANIA = 1_036_218;

// ============ ZONAS ELEITORAIS APARECIDA DE GOIÂNIA ============
export const ZONAS_APARECIDA = [
  { zona: "1ª Zona Aparecida", nome: "Centro / Garavelo / Expansão", eleitores: 105000, cor: "#6A0DAD" },
  { zona: "2ª Zona Aparecida", nome: "Tiradentes / Conde dos Arcos / Trindade", eleitores: 105000, cor: "#8B008B" },
  { zona: "3ª Zona Aparecida", nome: "Vila Brasília / Anhanguera / Industrial", eleitores: 105000, cor: "#BA55D3" },
  { zona: "4ª Zona Aparecida", nome: "Eldorado / Santa Luzia / Novo Horizonte", eleitores: 105000, cor: "#E6E6FA" },
] as const;

export const TOTAL_ELEITORES_APARECIDA = 420_000;
export const TOTAL_HABITANTES_APARECIDA = 590_000;

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
