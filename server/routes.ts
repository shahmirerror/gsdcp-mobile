import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";

const BACKEND_BASE = "https://gsdcp.org/api/mobile";

async function proxyToBackend(path: string): Promise<{ status: number; body: any }> {
  const url = `${BACKEND_BASE}${path}`;
  const res = await fetch(url);
  const body = await res.json().catch(() => ({ success: false, error: { code: "PARSE_ERROR", message: "Invalid JSON response" } }));
  return { status: res.status, body };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/dogs", async (_req, res) => {
    try {
      const { status, body } = await proxyToBackend("/dogs");
      res.status(status).json(body);
    } catch (e: any) {
      res.status(502).json({ success: false, error: { code: "PROXY_ERROR", message: e.message } });
    }
  });

  app.get("/api/dogs/:id", async (req, res) => {
    try {
      const { status, body } = await proxyToBackend(`/dogs/${req.params.id}`);
      res.status(status).json(body);
    } catch (e: any) {
      res.status(502).json({ success: false, error: { code: "PROXY_ERROR", message: e.message } });
    }
  });

  app.get("/api/breeders", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.get("/api/breeders/:id", (req, res) => {
    res.json({ success: false, error: { code: "NOT_FOUND", message: "Breeder not found" } });
  });

  app.get("/api/shows", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.get("/api/shows/:id", (req, res) => {
    res.json({ success: false, error: { code: "NOT_FOUND", message: "Show not found" } });
  });

  app.get("/api/show-results", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.get("/api/show-results/:showId", (req, res) => {
    res.json({ success: true, data: { show: null, resultsByClass: {} } });
  });

  app.get("/api/profile", (_req, res) => {
    res.json({ success: true, data: { user: null, dogs: [] } });
  });

  return httpServer;
}
