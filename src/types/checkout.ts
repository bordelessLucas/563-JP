export type CartItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  message: string;
};

export type RecipientDraft = {
  name: string;
  phone: string;
  notes: string;
};

export type DeliveryAddressDraft = {
  id?: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
};

export type DeliveryQuoteDraft = {
  provider: string;
  quoteId: string;
  feeCents: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
};

export type CheckoutDraft = {
  recipient: RecipientDraft;
  address: DeliveryAddressDraft | null;
  deliveryDate: string;
  deliveryPeriodId: string;
  deliveryPeriodLabel: string;
  deliveryQuote?: DeliveryQuoteDraft | null;
};

export function createEmptyRecipient(): RecipientDraft {
  return {
    name: "",
    phone: "",
    notes: "",
  };
}

export function createEmptyAddress(): DeliveryAddressDraft {
  return {
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
  };
}

export type Cart = {
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  checkout: CheckoutDraft | null;
};

export type SavedAddress = DeliveryAddressDraft & {
  id: string;
  userId: string;
};

export type DeliveryPeriod = {
  id: string;
  label: string;
  active: boolean;
};

export type OperationSettings = {
  deliveryFee: number;
  periods: DeliveryPeriod[];
};
