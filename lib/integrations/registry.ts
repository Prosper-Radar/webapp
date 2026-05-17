/**
 * Optional integrations — document env keys. Client UI only checks NEXT_PUBLIC_*.
 */
export const INTEGRATION_ROWS = [
  {
    id: "mapbox",
    label: "Mapbox",
    description: "Carte & tuiles 3D",
    envPublicKey: "NEXT_PUBLIC_MAPBOX_TOKEN" as const,
  },
  {
    id: "dealscout-api",
    label: "API",
    description: "FastAPI (URL publique)",
    envPublicKey: "NEXT_PUBLIC_API_URL" as const,
  },
  {
    id: "weather",
    label: "Météo",
    description: "Open-Meteo via /api/weather",
    envPublicKey: null,
  },
] as const;
