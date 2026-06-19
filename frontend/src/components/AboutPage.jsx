import React from "react";
import CloudsBackground from "./CloudsBackground";
import { Sparkles, Shield, Star } from "lucide-react";

export default function AboutPage() {
  const developers = [
    {
      name: "Aarav Mehta",
      role: "Lead Backend Architect",
      bio: "Full stack wizard who thrives on optimizing high-throughput APIs, orchestrating database transactions, and keeping the Karma Engine running flawlessly.",
      avatar: "AM",
      color: "from-blue-400 to-indigo-500",
    },
    {
      name: "Kabir Sen",
      role: "Frontend Engineer & UI/UX",
      bio: "A pixel-perfectionist dedicated to crafting gorgeous, fluid user interfaces. If there's a cloud animation or glassmorphic card, Kabir probably designed it.",
      avatar: "KS",
      color: "from-pink-400 to-rose-500",
    },
    {
      name: "Rhea Sharma",
      role: "Product & AI Lead",
      bio: "Brings smart planning to life. Rhea designs the AI-driven budget generators, coordinates dispute resolution processes, and keeps users secure.",
      avatar: "RS",
      color: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <CloudsBackground>This is a dumb dummy page, ignore it </CloudsBackground>
  );
}
