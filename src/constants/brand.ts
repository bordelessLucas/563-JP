/**
 * Identidade oficial — Floricultura Chuva de Ouro (Anápolis-GO)
 * Referência: logo e site chuvadeourofloricultura.com.br
 */
export const brand = {
  name: "Chuva de Ouro",
  fullName: "Floricultura Chuva de Ouro",
  tagline: "Entregamos sentimentos, não apenas flores.",
  city: "Anápolis-GO",
  address: "Av. Pres. Kennedy, 121 - Maracanã, Anápolis - GO, 75043-044",
  phoneDisplay: "(62) 98626-7131",
  whatsappE164: "5562986267131",
  hours: "Segunda a Sábado · 8h às 18h",
  hoursNote: "Atendimento 24h para coroas fúnebres",
  website: "https://www.chuvadeourofloricultura.com.br/",
  /** Logo fundo preto (tema dark) */
  logoDark: require("../../assets/images/logo-chuva-de-ouro.png"),
  /** Logo fundo branco (tema light) */
  logoLight: require("../../assets/images/logo-chuva-de-ouro-light.png"),
} as const;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${brand.whatsappE164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
