// services/marketService.ts
import { RawPriceData, ItemDefinitionMap, ServerInfo } from "../types";

// Use stable gaming.tools API endpoints
const ITEM_DEFS_API_URL = "https://scdn.gaming.tools/nwmp/data/items/en.json";
const SERVERS_API_URL = "https://nwmpapi.gaming.tools/servers";
const PRICES_API_URL_BASE = "https://gaming.tools/prices/nwmp?serverName=";

// This proxy has proven to be reliable for bypassing CORS issues.
const PROXY_URL = "https://api.allorigins.win/json?url="; //https://api.allorigins.win/json?url=

let itemDefinitionsCache: ItemDefinitionMap | null = null;
let serversCache: ServerInfo[] | null = null;

async function fetchJsonWithProxy<T>(targetUrl: string): Promise<T | null> {
  // Check if we're in Electron environment - more robust detection
  const isElectron =
    typeof window !== "undefined" &&
    window.electronAPI &&
    typeof window.electronAPI !== "undefined";

  if (!isElectron) {
    console.warn(
      "Market API calls are only available in the desktop Electron app due to CORS restrictions"
    );
    throw new Error(
      "Market API is only available in the desktop Electron application"
    );
  }

  try {
    // Try direct fetch first (works in Electron)
    const response = await fetch(targetUrl);
    if (response.ok) {
      return (await response.json()) as T;
    }
  } catch (directFetchError) {
    console.log("Direct fetch failed, trying proxy:", directFetchError);
  }

  // Fallback to proxy if direct fetch fails
  const proxyUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to connect to the proxy service. Status: ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data.status &&
      (data.status.http_code < 200 || data.status.http_code >= 300)
    ) {
      if (data.status.http_code === 404) {
        console.warn(`Resource not found (404) at target URL ${targetUrl}.`);
        return null; // Return null for 404
      }
      console.error("Error from target URL:", data.status);
      throw new Error(
        `Failed to fetch data from ${targetUrl}. The market API returned status: ${data.status.http_code}`
      );
    }

    if (data.contents === null) {
      console.warn(
        `Resource not found (possibly 404) at target URL ${targetUrl}.`
      );
      return null;
    }

    if (typeof data.contents !== "string" || data.contents.trim() === "") {
      console.warn(
        `Proxy response for ${targetUrl} had empty or invalid 'contents', returning null.`
      );
      return null;
    }

    try {
      const parsedContent = JSON.parse(data.contents);
      return parsedContent as T;
    } catch (e) {
      console.error(
        `Failed to parse JSON from proxy content for ${targetUrl}. Content starts with:\n` +
          data.contents.substring(0, 200)
      );
      console.error("\nError parsing JSON:", e);
      throw new Error(
        `Failed to parse JSON from proxy content. The response was not valid JSON.`
      );
    }
  } catch (error) {
    console.error(`Network or proxy error for ${targetUrl}:`, error);
    throw error;
  }
}

async function fetchItemDefinitions(): Promise<ItemDefinitionMap> {
  if (itemDefinitionsCache) {
    return itemDefinitionsCache;
  }
  const itemDefs =
    await fetchJsonWithProxy<ItemDefinitionMap>(ITEM_DEFS_API_URL);

  if (itemDefs === null) {
    console.error(
      "Could not fetch item definitions. This is a critical failure. Market data may be incorrect."
    );
    itemDefinitionsCache = {}; // Cache empty object to prevent re-fetching a missing file
    return {};
  }

  // Normalize keys to lowercase for consistent matching
  itemDefinitionsCache = Object.entries(itemDefs).reduce<ItemDefinitionMap>(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    },
    {}
  );
  return itemDefinitionsCache;
}

async function fetchPrices(serverApiId: string): Promise<RawPriceData[]> {
  const url = `${PRICES_API_URL_BASE}${serverApiId[0].toUpperCase()}${serverApiId.slice(1)}`;
  const prices = await fetchJsonWithProxy<RawPriceData[]>(url);
  return prices === null ? [] : prices; // Return empty array if prices not found
}

export async function fetchServers(): Promise<ServerInfo[]> {
  if (serversCache) {
    return serversCache;
  }
  const servers = await fetchJsonWithProxy<ServerInfo[]>(SERVERS_API_URL);
  serversCache = servers === null ? [] : servers; // Return empty array if server list not found
  return serversCache;
}

async function getServerApiId(serverName: string): Promise<string> {
  const servers = await fetchServers();
  const server = servers.find(
    s => s.name.toLowerCase() === serverName.toLowerCase().trim()
  );
  console.log("Server found:", server?.name);
  if (!server) {
    throw new Error(
      `Server "${serverName}" not found. Please check the name and try again.`
    );
  }
  return server.id;
}

/**
 * Fetches all prices for a given server and returns a Map of lowercase item names to prices.
 */
export async function fetchPricesByItemName(
  serverName: string
): Promise<Map<string, number>> {
  const [itemDefs, serverApiId] = await Promise.all([
    fetchItemDefinitions(),
    getServerApiId(serverName)
  ]);

  const rawPrices = await fetchPrices(serverApiId);

  const priceMap = new Map<string, number>();

  for (const priceEntry of rawPrices) {
    const _itemName = itemDefs[priceEntry.item_id];
    for (const itempricename of Object.values(itemDefs)) {
      //console.log('Item price name:', itempricename);
      // console.log('Item name:', itemName);
      if (itempricename) {
        priceMap.set(itempricename, priceEntry.price);
        //console.log('Item price name:' + itempricename + ' | Price added:', priceEntry.price);
      }
    }
  }

  return priceMap;
}
