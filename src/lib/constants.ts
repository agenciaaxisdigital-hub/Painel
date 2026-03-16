// ============ ZONAS ELEITORAIS GOIÂNIA ============
export const ZONAS_ELEITORAIS = [
  { zona: "1ª", eleitores: 132598, cor: "#E8825C" },
  { zona: "2ª", eleitores: 114960, cor: "#7BB5E0" },
  { zona: "127ª", eleitores: 154000, cor: "#E8D44D" },
  { zona: "133ª", eleitores: 134028, cor: "#E8A84D" },
  { zona: "134ª", eleitores: 159000, cor: "#A8D44D" },
  { zona: "135ª", eleitores: 120000, cor: "#B88CE0" },
  { zona: "136ª", eleitores: 140000, cor: "#4D5BB8" },
  { zona: "146ª", eleitores: 114000, cor: "#4DB86B" },
  { zona: "147ª", eleitores: 118000, cor: "#4DB8D4" },
] as const;

export const TOTAL_ELEITORES_GOIANIA = 1_036_218;

export const ZONE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  ZONAS_ELEITORAIS.map((z) => [z.zona, z.cor])
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
