export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function stockLabel(
  status: "in_stock" | "limited" | "out_of_stock",
): string {
  switch (status) {
    case "in_stock":
      return "Disponível";
    case "limited":
      return "Poucas unidades";
    case "out_of_stock":
      return "Indisponível";
  }
}

export function stockTone(
  status: "in_stock" | "limited" | "out_of_stock",
): "success" | "warning" | "error" {
  switch (status) {
    case "in_stock":
      return "success";
    case "limited":
      return "warning";
    case "out_of_stock":
      return "error";
  }
}

export function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
