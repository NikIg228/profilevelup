/**
 * Оценка времени генерации PDF на бэкенде:
 * валидация → DOCX → LibreOffice → PDF → загрузка в Storage.
 * FREE/EXTENDED: один PDF ~60–120 с → 90 с.
 * PREMIUM: два PDF ~120–240 с → 180 с.
 */
export const REPORT_ESTIMATED_SECONDS = {
  FREE: 90,
  EXTENDED: 90,
  PREMIUM: 180,
} as const;

export type ReportTariff = keyof typeof REPORT_ESTIMATED_SECONDS;

export function getReportEstimatedSeconds(tariff: ReportTariff | string): number {
  return REPORT_ESTIMATED_SECONDS[tariff as ReportTariff] ?? REPORT_ESTIMATED_SECONDS.EXTENDED;
}

/** Склонение для фразы "через N секунд" */
export function formatSecondsRemaining(sec: number): string {
  const n = Math.max(0, Math.floor(sec));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} секунд`;
  if (mod10 === 1) return `${n} секунду`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} секунды`;
  return `${n} секунд`;
}
