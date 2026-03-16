export interface LocationEvidenceRecord {
  endereco_ip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
  cep?: string | null;
  rua?: string | null;
  endereco_completo?: string | null;
  zona_eleitoral?: string | null;
  regiao_planejamento?: string | null;
}

function hasText(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value?: number | null): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

export function hasUsableLocation(record?: LocationEvidenceRecord | null): boolean {
  if (!record) return false;

  const hasCoordinates = hasNumber(record.latitude) && hasNumber(record.longitude);

  return (
    hasText(record.endereco_ip) ||
    hasCoordinates ||
    hasText(record.cidade) ||
    hasText(record.estado) ||
    hasText(record.bairro) ||
    hasText(record.cep) ||
    hasText(record.rua) ||
    hasText(record.endereco_completo) ||
    hasText(record.zona_eleitoral) ||
    hasText(record.regiao_planejamento)
  );
}

export function filterValidLocationRecords<T extends LocationEvidenceRecord>(records?: T[] | null): T[] {
  return (records || []).filter((record) => hasUsableLocation(record));
}
