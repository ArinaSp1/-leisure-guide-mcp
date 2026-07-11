import type { TimelineEvent } from "./types.js";

export interface EvidenceLine {
  eventId: string;
  label: string;
  detail: string;
  timestamp: string;
  contribution: number;
  simulated: boolean;
}

export interface LocationCandidate {
  place: string;
  confidence: number;
  score: number;
  lastSeenAt: string;
  evidence: EvidenceLine[];
}

export interface ItemInvestigation {
  found: boolean;
  item: string;
  conclusion: string;
  bestCandidate?: LocationCandidate;
  alternatives: LocationCandidate[];
  caveat: string;
}

const HOUR = 60 * 60 * 1000;

function sameItem(event: TimelineEvent, item: string): boolean {
  return event.type === "item_seen" && String(event.metadata?.item ?? "").trim().toLowerCase() === item.trim().toLowerCase();
}

function hoursBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / HOUR;
}

function sourceBonus(event: TimelineEvent): number {
  const method = String(event.metadata?.method ?? "");
  if (method === "manual") return 25;
  if (method.includes("bluetooth")) return 20;
  if (method.includes("checklist")) return 14;
  return 10;
}

function recencyBonus(timestamp: string, now: Date): number {
  const ageHours = Math.max(0, (now.getTime() - new Date(timestamp).getTime()) / HOUR);
  return Math.max(0, Math.round(24 - ageHours / 3));
}

export function investigateItem(events: TimelineEvent[], item: string, now = new Date()): ItemInvestigation {
  const sightings = events.filter((event) => sameItem(event, item));
  if (!sightings.length) {
    return { found: false, item, conclusion: `No evidence has been recorded for ${item}.`, alternatives: [], caveat: "Record a manual sighting before asking Leisure Guide to infer a location." };
  }

  const grouped = new Map<string, TimelineEvent[]>();
  for (const sighting of sightings) {
    const place = String(sighting.metadata?.place ?? "unknown").trim() || "unknown";
    grouped.set(place, [...(grouped.get(place) ?? []), sighting]);
  }

  const candidates: LocationCandidate[] = [];
  for (const [place, placeSightings] of grouped) {
    placeSightings.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const latest = placeSightings[0];
    const evidence: EvidenceLine[] = [];
    evidence.push({ eventId: latest.id, label: "Direct sighting", detail: latest.detail ?? latest.title, timestamp: latest.timestamp, contribution: Math.round(latest.confidence * 40), simulated: Boolean(latest.simulated) });
    evidence.push({ eventId: latest.id, label: "Detection source", detail: `Method: ${String(latest.metadata?.method ?? latest.source)}`, timestamp: latest.timestamp, contribution: sourceBonus(latest), simulated: Boolean(latest.simulated) });
    const recentScore = recencyBonus(latest.timestamp, now);
    evidence.push({ eventId: latest.id, label: "Recency", detail: recentScore > 12 ? "The evidence is recent." : "Older evidence is less reliable.", timestamp: latest.timestamp, contribution: recentScore, simulated: Boolean(latest.simulated) });

    const corroboratingPlaces = events.filter((event) => event.type === "place_seen" && String(event.metadata?.place ?? "").toLowerCase() === place.toLowerCase() && hoursBetween(event.timestamp, latest.timestamp) <= 2).slice(0, 2);
    for (const corroboration of corroboratingPlaces) {
      evidence.push({ eventId: corroboration.id, label: "Place corroboration", detail: corroboration.detail ?? corroboration.title, timestamp: corroboration.timestamp, contribution: Math.round(corroboration.confidence * 12), simulated: Boolean(corroboration.simulated) });
    }

    if (placeSightings.length > 1) {
      evidence.push({ eventId: placeSightings[1].id, label: "Repeated evidence", detail: `${placeSightings.length} sightings point to ${place}.`, timestamp: placeSightings[1].timestamp, contribution: Math.min(12, (placeSightings.length - 1) * 6), simulated: placeSightings.every((event) => Boolean(event.simulated)) });
    }
    if (latest.simulated) {
      evidence.push({ eventId: latest.id, label: "Simulation penalty", detail: "Demo evidence is weighted below real observations.", timestamp: latest.timestamp, contribution: -12, simulated: true });
    }

    const score = evidence.reduce((sum, line) => sum + line.contribution, 0);
    candidates.push({ place, score, confidence: Math.max(5, Math.min(99, score)), lastSeenAt: latest.timestamp, evidence });
  }

  candidates.sort((a, b) => b.score - a.score || b.lastSeenAt.localeCompare(a.lastSeenAt));
  const bestCandidate = candidates[0];
  const allSimulated = bestCandidate.evidence.every((line) => line.simulated);
  return {
    found: true,
    item,
    conclusion: `${item} is most likely at ${bestCandidate.place}.`,
    bestCandidate,
    alternatives: candidates.slice(1, 3),
    caveat: allSimulated ? "This conclusion currently uses simulated evidence only." : "This is an inference from recorded signals, not a guaranteed live location.",
  };
}
