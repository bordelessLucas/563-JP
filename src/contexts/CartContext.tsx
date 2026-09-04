import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/src/contexts/AuthContext";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  saveCheckoutDraft,
  updateCartItemMessage,
  updateCartItemQuantity,
} from "@/src/services/cart.service";
import { Cart, CartItem, CheckoutDraft } from "@/src/types/checkout";

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addItem: (
    item: Omit<CartItem, "quantity" | "message"> & {
      quantity: number;
      message?: string;
    },
  ) => Promise<void>;
  setItemQuantity: (productId: string, quantity: number) => Promise<void>;
  setItemMessage: (productId: string, message: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  saveCheckout: (checkout: CheckoutDraft) => Promise<void>;
  emptyCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: PropsWithChildren) {
  const { user, isAdmin } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user || isAdmin) {
      setCart(null);
      return;
    }

    setLoading(true);
    try {
      const nextCart = await getCart(user.uid);
      setCart(nextCart);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      itemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      refreshCart,
      addItem: async (item) => {
        if (!user) return;
        const nextCart = await addCartItem(user.uid, item);
        setCart(nextCart);
      },
      setItemQuantity: async (productId, quantity) => {
        if (!user) return;
        const nextCart = await updateCartItemQuantity(
          user.uid,
          productId,
          quantity,
        );
        setCart(nextCart);
      },
      setItemMessage: async (productId, message) => {
        if (!user) return;
        const nextCart = await updateCartItemMessage(
          user.uid,
          productId,
          message,
        );
        setCart(nextCart);
      },
      removeItem: async (productId) => {
        if (!user) return;
        const nextCart = await removeCartItem(user.uid, productId);
        setCart(nextCart);
      },
      saveCheckout: async (checkout) => {
        if (!user) return;
        const nextCart = await saveCheckoutDraft(user.uid, checkout);
        setCart(nextCart);
      },
      emptyCart: async () => {
        if (!user) return;
        await clearCart(user.uid);
        setCart(null);
      },
    }),
    [cart, loading, refreshCart, user],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
