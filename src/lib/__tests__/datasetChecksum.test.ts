import { describe, it, expect, beforeEach } from "vitest";
import {
  computeDatasetChecksum,
  validateDatasetCoherence,
  fnv1a,
  readStoredChecksum,
} from "../datasetChecksum";

beforeEach(() => {
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  (globalThis as any).__APP_VERSION__ = "test-v1";
});

describe("fnv1a", () => {
  it("produit toujours le même hash pour la même entrée", () => {
    expect(fnv1a("abc")).toBe(fnv1a("abc"));
  });
  it("produit des hashes différents pour entrées différentes", () => {
    expect(fnv1a("abc")).not.toBe(fnv1a("abd"));
  });
});

describe("computeDatasetChecksum", () => {
  it("est insensible à l'ordre des items", () => {
    const a = [
      { id: "1", updated_at: "2026-01-01" },
      { id: "2", updated_at: "2026-01-02" },
    ];
    const b = [
      { id: "2", updated_at: "2026-01-02" },
      { id: "1", updated_at: "2026-01-01" },
    ];
    expect(computeDatasetChecksum(a).checksum).toBe(computeDatasetChecksum(b).checksum);
  });

  it("change quand un updated_at change", () => {
    const a = [{ id: "1", updated_at: "2026-01-01" }];
    const b = [{ id: "1", updated_at: "2026-01-02" }];
    expect(computeDatasetChecksum(a).checksum).not.toBe(computeDatasetChecksum(b).checksum);
  });

  it("retourne checksum 'empty' déterministe pour liste vide ou null", () => {
    const c1 = computeDatasetChecksum([]);
    const c2 = computeDatasetChecksum(null);
    const c3 = computeDatasetChecksum(undefined);
    expect(c1.checksum).toBe(c2.checksum);
    expect(c1.checksum).toBe(c3.checksum);
    expect(c1.count).toBe(0);
  });

  it("compte correctement les items", () => {
    const items = [
      { id: "1", updated_at: "x" },
      { id: "2", updated_at: "y" },
      { id: "3", updated_at: "z" },
    ];
    expect(computeDatasetChecksum(items).count).toBe(3);
  });
});

describe("validateDatasetCoherence", () => {
  const items = [{ id: "1", updated_at: "2026-01-01" }];

  it("première écriture → reason='first_load' et isStale=false", () => {
    const r = validateDatasetCoherence("prices", items);
    expect(r.reason).toBe("first_load");
    expect(r.isStale).toBe(false);
    expect(readStoredChecksum("prices")?.checksum).toBe(r.current.checksum);
  });

  it("même dataset au 2e appel → reason='ok' et isStale=false", () => {
    validateDatasetCoherence("prices", items);
    const r = validateDatasetCoherence("prices", items);
    expect(r.reason).toBe("ok");
    expect(r.isStale).toBe(false);
  });

  it("changement de checksum → isStale=true et émission de l'event", () => {
    validateDatasetCoherence("prices", items);

    let staleEvent: any = null;
    const handler = (e: any) => {
      staleEvent = e;
    };
    window.addEventListener("ujamaan:dataset-stale", handler);

    const r = validateDatasetCoherence("prices", [
      { id: "1", updated_at: "2026-02-01" },
    ]);

    expect(r.isStale).toBe(true);
    expect(r.reason).toBe("checksum_changed");
    expect(staleEvent).not.toBeNull();
    expect(staleEvent.detail.key).toBe("prices");
    expect(staleEvent.detail.reason).toBe("checksum_changed");

    window.removeEventListener("ujamaan:dataset-stale", handler);
  });

  it("changement de version d'app → reason='version_changed' et isStale=true", () => {
    validateDatasetCoherence("events", items);
    (globalThis as any).__APP_VERSION__ = "test-v2";
    const r = validateDatasetCoherence("events", items);
    expect(r.isStale).toBe(true);
    expect(r.reason).toBe("version_changed");
  });

  it("isole les datasets entre eux (prices ≠ events)", () => {
    validateDatasetCoherence("prices", items);
    const r = validateDatasetCoherence("events", items);
    expect(r.reason).toBe("first_load");
  });
});
