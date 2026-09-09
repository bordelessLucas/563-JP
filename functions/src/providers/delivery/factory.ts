import { getDeliveryProviderId } from "../../config";
import { AppError } from "../../lib/errors";
import { MockDeliveryProvider } from "./MockDeliveryProvider";
import { UberDirectProvider } from "./UberDirectProvider";
import { DeliveryProvider } from "./types";

let singleton: DeliveryProvider | null = null;

export function getDeliveryProvider(): DeliveryProvider {
  if (singleton) return singleton;
  const id = getDeliveryProviderId();
  if (id === "uber_direct") {
    singleton = new UberDirectProvider();
    return singleton;
  }
  if (id === "mock") {
    singleton = new MockDeliveryProvider();
    return singleton;
  }
  throw new AppError({
    code: "delivery_provider_unknown",
    message: `Unknown delivery provider ${id}`,
    publicMessage: "Serviço de entrega indisponível.",
    status: 503,
  });
}

/** Test helper */
export function resetDeliveryProviderForTests() {
  singleton = null;
}
