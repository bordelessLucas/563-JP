export type CepLookupResult = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export async function lookupCep(cep: string): Promise<CepLookupResult | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = (await response.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) return null;

  return {
    cep: formatCep(data.cep ?? digits),
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}
