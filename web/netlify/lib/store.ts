import { getStore } from "@netlify/blobs";
import { messengerStatus, type Messenger, type PublicMessenger, type Shipment } from "../../src/lib/types";

const store = (name: string) => getStore({ name, consistency: "strong" });

export const shipments = () => store("shipments");
export const messengers = () => store("messengers");
/** Foto degli oggetti: private, mai servite pubblicamente. */
export const shipmentPhotos = () => store("shipment-photos");
/** Documenti d'identità dei Messenger: privati, mai serviti pubblicamente. */
export const messengerDocuments = () => store("messenger-documents");

export async function getShipment(id: string): Promise<Shipment | null> {
  return (await shipments().get(id, { type: "json" })) as Shipment | null;
}

export async function getMessenger(id: string): Promise<Messenger | null> {
  return (await messengers().get(id, { type: "json" })) as Messenger | null;
}

export async function saveFiles(target: ReturnType<typeof store>, prefix: string, list: File[]): Promise<string[]> {
  return Promise.all(
    list.map(async (file, i) => {
      const key = `${prefix}/${i}`;
      await target.set(key, await file.arrayBuffer(), { metadata: { contentType: file.type, name: file.name } });
      return key;
    }),
  );
}

export function toPublic(m: Messenger): PublicMessenger {
  return {
    id: m.id,
    displayName: `${m.firstName} ${m.lastName.charAt(0).toUpperCase()}.`,
    flight: m.flight,
    availableKg: m.availableKg,
    verified: messengerStatus(m) === "verificato",
  };
}

export async function listAll<T>(target: ReturnType<typeof store>): Promise<T[]> {
  const { blobs } = await target.list();
  const items = (await Promise.all(blobs.map((b) => target.get(b.key, { type: "json" })))) as (T | null)[];
  return items.filter((x): x is T => !!x);
}
