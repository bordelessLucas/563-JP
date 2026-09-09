import { NormalizedAddress } from "../domain/types";
import { AppError } from "../lib/errors";
import { normalizeAddress } from "./PricingService";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodeAddressInput = Parameters<typeof normalizeAddress>[0];

/**
 * Optional external geocoder. No provider is auto-selected —
 * configure one explicitly when the business chooses Google/Mapbox/etc.
 */
export interface GeocodingProvider {
  geocode(address: GeocodeAddressInput): Promise<Coordinates>;
}

export class UnconfiguredGeocodingProvider implements GeocodingProvider {
  async geocode(_address: GeocodeAddressInput): Promise<Coordinates> {
    throw new AppError({
      code: "GEOCODING_NOT_CONFIGURED",
      message: "No GeocodingProvider configured",
      publicMessage:
        "Geocoding ainda não está configurado. Informe latitude/longitude no endereço.",
      status: 503,
    });
  }
}

/**
 * Address normalization + optional coordinates.
 * Does NOT invent lat/lng.
 */
export class GeocodingService {
  constructor(
    private readonly provider: GeocodingProvider = new UnconfiguredGeocodingProvider(),
  ) {}

  normalize(input: GeocodeAddressInput): NormalizedAddress {
    return normalizeAddress(input);
  }

  async enrichWithGeocode(
    address: NormalizedAddress,
  ): Promise<NormalizedAddress> {
    if (
      address.latitude != null &&
      address.longitude != null &&
      Number.isFinite(address.latitude) &&
      Number.isFinite(address.longitude)
    ) {
      return address;
    }
    const coords = await this.provider.geocode(address);
    return {
      ...address,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }

  requireCoordinates(address: NormalizedAddress): NormalizedAddress {
    if (
      address.latitude == null ||
      address.longitude == null ||
      !Number.isFinite(address.latitude) ||
      !Number.isFinite(address.longitude)
    ) {
      throw new AppError({
        code: "MISSING_COORDINATES",
        message: "Address missing latitude/longitude",
        publicMessage:
          "Não foi possível localizar o endereço para cotação. Confirme o endereço completo com coordenadas.",
        status: 400,
      });
    }
    return address;
  }
}

export const geocodingService = new GeocodingService();
