import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => { throw redirect({ to: "/dashboard" }); },
  head: () => ({
    meta: [
      { title: "NexusRetail OS — Autonomous Retail Operations" },
      { name: "description", content: "Inventory, procurement, FEFO and omnichannel stock control for Indian retail." },
      { property: "og:title", content: "NexusRetail OS" },
      { property: "og:description", content: "Autonomous retail operations for Indian supermarkets and dark stores." },
    ],
  }),
});
