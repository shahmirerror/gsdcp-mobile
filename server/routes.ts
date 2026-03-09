import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/dogs", (_req, res) => {
    res.json({ message: "GET /api/dogs - placeholder" });
  });

  app.get("/api/dogs/:id", (req, res) => {
    res.json({ message: `GET /api/dogs/${req.params.id} - placeholder` });
  });

  app.get("/api/breeders", (_req, res) => {
    res.json({ message: "GET /api/breeders - placeholder" });
  });

  app.get("/api/breeders/:id", (req, res) => {
    res.json({ message: `GET /api/breeders/${req.params.id} - placeholder` });
  });

  app.get("/api/shows", (_req, res) => {
    res.json({ message: "GET /api/shows - placeholder" });
  });

  app.get("/api/shows/:id", (req, res) => {
    res.json({ message: `GET /api/shows/${req.params.id} - placeholder` });
  });

  app.get("/api/show-results", (_req, res) => {
    res.json({ message: "GET /api/show-results - placeholder" });
  });

  app.get("/api/show-results/:showId", (req, res) => {
    res.json({ message: `GET /api/show-results/${req.params.showId} - placeholder` });
  });

  app.get("/api/profile", (_req, res) => {
    res.json({ message: "GET /api/profile - placeholder" });
  });

  return httpServer;
}
