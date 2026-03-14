"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Calculator, Share2, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl px-6 pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center">
        <div className="p-4 bg-primary rounded-3xl shadow-2xl shadow-primary/20 border border-accent/20 mb-8 animate-in zoom-in duration-700">
          <Crown className="w-12 h-12 md:w-16 md:h-16 text-accent" />
        </div>
        <h1 className="text-5xl md:text-8xl font-headline text-accent mb-6 tracking-tight">
          RoyalSplit
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-body max-w-2xl mb-10 leading-relaxed">
          Smart Expense Sharing for Friends, Trips, and Groups. 
          Split expenses easily, track balances, and settle debts with minimal transactions.
        </p>
        <Button 
          onClick={onStart}
          size="lg"
          className="h-16 px-10 bg-accent hover:bg-accent/90 text-accent-foreground text-xl font-bold rounded-2xl shadow-xl shadow-accent/10 flex items-center gap-3 transition-all hover:scale-105"
        >
          Start Splitting Expenses <ArrowRight className="w-6 h-6" />
        </Button>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard 
          icon={<Calculator className="w-8 h-8 text-accent" />}
          title="Equal & Custom Splits"
          description="Split expenses equally or assign custom amounts/percentages to each participant."
        />
        <FeatureCard 
          icon={<CheckCircle2 className="w-8 h-8 text-accent" />}
          title="Simplified Debts"
          description="Automatically minimize the number of payments needed to settle group balances."
        />
        <FeatureCard 
          icon={<Share2 className="w-8 h-8 text-accent" />}
          title="Settlement Simulation"
          description="Preview how balances change in real-time before you confirm any transaction."
        />
        <FeatureCard 
          icon={<TrendingUp className="w-8 h-8 text-accent" />}
          title="Expense Insights"
          description="View elegant charts and ledgers showing how group balances evolve over time."
        />
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl px-6 py-12 mt-auto border-t border-border/10 text-center">
        <p className="text-muted-foreground/40 text-sm tracking-widest uppercase">
          RoyalSplit &bull; Premium Expense Sovereignty &copy; 2026
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-card/50 border-primary/10 hover:border-accent/30 transition-all hover:translate-y-[-4px] shadow-lg">
      <CardContent className="p-8 flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-primary/10 rounded-2xl">
          {icon}
        </div>
        <h3 className="text-xl font-headline text-accent mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
