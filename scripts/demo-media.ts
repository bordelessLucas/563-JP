/**
 * URLs de mídia do protótipo (Unsplash — IDs verificados 200 OK em 2026-09-08).
 * Usar crop consistente para cards/galeria/banners.
 */

const q = "auto=format&fit=crop&w=1200&q=80";
const qThumb = "auto=format&fit=crop&w=800&q=80";
const qHero = "auto=format&fit=crop&w=1600&q=80";

function u(id: string, size: "full" | "thumb" | "hero" = "full") {
  const params = size === "hero" ? qHero : size === "thumb" ? qThumb : q;
  return `https://images.unsplash.com/${id}?${params}`;
}

export const DEMO_MEDIA = {
  categories: {
    flores: u("photo-1490750967868-88aa4486c946", "thumb"),
    buques: u("photo-1563241527-3004b7be0ffd", "thumb"),
    arranjos: u("photo-1457089328109-e5d9bd499191", "thumb"),
    presentes: u("photo-1557471311-da136cd4fb86", "thumb"),
    complementos: u("photo-1676392713729-fd584a6299c6", "thumb"),
  },
  products: {
    "rosa-vermelha": [
      u("photo-1518709268805-4e9042af9f23"),
      u("photo-1496060169243-453fde45943b"),
      u("photo-1589095181425-c038b3871b6a"),
    ],
    "buque-romance": [
      u("photo-1563241527-3004b7be0ffd"),
      u("photo-1487530811176-3780de880c2d"),
      u("photo-1730749387748-79e6d50a269c"),
    ],
    "arranjo-jardim": [
      u("photo-1491147334573-44cbb4602074"),
      u("photo-1457089328109-e5d9bd499191"),
      u("photo-1498814117408-e396f5507073"),
    ],
    girassol: [
      u("photo-1608656600560-c99b9e7a0de5"),
      u("photo-1608825154649-2e9bb4cd4211"),
      u("photo-1617176756162-447320192d98"),
    ],
    "buque-lirios": [
      u("photo-1526047932273-341f2a7631f9"),
      u("photo-1557925923-6885735abfb1"),
      u("photo-1490750967868-88aa4486c946"),
    ],
    "centro-mesa": [
      u("photo-1530488228536-37ae1dbb20a4"),
      u("photo-1468327768560-75b778cbb551"),
      u("photo-1533616688419-b7a585564566"),
    ],
    "kit-encanto": [
      u("photo-1513885535751-8b9238bd345a"),
      u("photo-1557471311-da136cd4fb86"),
      u("photo-1608825154649-2e9bb4cd4211"),
    ],
    chocolates: [
      u("photo-1676392713729-fd584a6299c6"),
      u("photo-1481391319762-47dff72954d9"),
      u("photo-1557471311-da136cd4fb86"),
    ],
    "orquidea-rosa": [
      u("photo-1604072762229-9075f8878d30"),
      u("photo-1487070183336-b863922373d4"),
      u("photo-1501004318641-b39e6451bec6"),
    ],
  },
  banners: {
    "promo-semana": u("photo-1519378058457-4c29a0a2efac", "hero"),
    "banner-primavera": u("photo-1685613858397-64f79a0f3603", "hero"),
    "promo-rascunho": u("photo-1487530811176-3780de880c2d", "hero"),
  },
} as const;

export const DEFAULT_PRODUCT_IMAGE = DEMO_MEDIA.products["rosa-vermelha"][0];
export const DEFAULT_CATEGORY_IMAGE = DEMO_MEDIA.categories.flores;
export const DEFAULT_BANNER_IMAGE = DEMO_MEDIA.banners["promo-semana"];
