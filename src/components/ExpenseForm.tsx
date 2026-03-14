"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Person, SplitType, ExpenseSplit, Expense, Debt } from "@/lib/types";
import { calculateBalances, simplifyDebts } from "@/lib/split-logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Plus, ArrowRight, Calculator, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ExpenseFormProps {
  people: Person[];
  currentExpenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

export function ExpenseForm({ people, currentExpenses, onAddExpense }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);

  useEffect(() => {
    if (open) {
      setSplits(people.map((p) => ({ personId: p.id, amount: 1 })));
      if (people.length > 0 && !paidBy) setPaidBy(people[0].id);
    }
  }, [open, people, paidBy]);

  const currentSimulatedExpense = useMemo((): Expense | null => {
    const numAmount = parseFloat(amount);
    if (!title || isNaN(numAmount) || !paidBy) return null;
    const finalSplits = splits.filter(s => s.amount > 0);
    if (splitType === "equal" && finalSplits.length === 0) return null;

    return {
      id: "simulated-id",
      title,
      amount: numAmount,
      paidBy,
      splitType,
      splits: finalSplits,
      date: Date.now(),
    };
  }, [title, amount, paidBy, splitType, splits]);

  const simulation = useMemo(() => {
    const currentBalances = calculateBalances(people, currentExpenses);
    const currentDebts = simplifyDebts(currentBalances);

    let simulatedDebts: Debt[] = [];
    if (currentSimulatedExpense) {
      const simulatedBalances = calculateBalances(people, [currentSimulatedExpense, ...currentExpenses]);
      simulatedDebts = simplifyDebts(simulatedBalances);
    }

    return { currentDebts, simulatedDebts };
  }, [people, currentExpenses, currentSimulatedExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSimulatedExpense) return;

    onAddExpense({
      ...currentSimulatedExpense,
      id: Math.random().toString(36).substr(2, 9),
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setSplitType("equal");
  };

  const toggleEqualParticipant = (id: string) => {
    setSplits(prev => {
      const existing = prev.find(s => s.personId === id);
      if (existing && existing.amount > 0) {
        return prev.map(s => s.personId === id ? { ...s, amount: 0 } : s);
      } else {
        return prev.map(s => s.personId === id ? { ...s, amount: 1 } : s);
      }
    });
  };

  const updateSplitAmount = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setSplits(prev => prev.map(s => s.personId === id ? { ...s, amount: num } : s));
  };

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name || "Unknown";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto h-12 md:h-14 px-6 bg-primary hover:bg-primary/80 text-primary-foreground font-headline flex items-center justify-center gap-2 rounded-xl">
          <Plus className="w-5 h-5" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[700px] border-primary/20 bg-card max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-headline text-accent flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6" /> Royal Entry
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs text-muted-foreground">Description</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Dinner, Palace Rent..."
                className="bg-background border-border h-11 text-base"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-background border-border h-11 text-base"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Paid By</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="bg-background border-border h-11">
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Split Method</Label>
              <Select value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
                <SelectTrigger className="bg-background border-border h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Split Equally</SelectItem>
                  <SelectItem value="unequal">Exact Amounts (₹)</SelectItem>
                  <SelectItem value="percentage">Percentages (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[150px] overflow-y-auto space-y-3 pr-2 custom-scrollbar border border-border/50 rounded-xl p-3 bg-primary/5">
              {people.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`check-${p.id}`}
                      checked={splits.find(s => s.personId === p.id)?.amount !== 0}
                      onCheckedChange={() => toggleEqualParticipant(p.id)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`check-${p.id}`} className="text-sm cursor-pointer py-1">{p.name}</Label>
                  </div>
                  {splitType !== "equal" && (
                    <div className="relative w-24">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={splitType === "percentage" ? "%" : "₹"}
                        value={splits.find(s => s.personId === p.id)?.amount || ""}
                        onChange={(e) => updateSplitAmount(p.id, e.target.value)}
                        className="h-9 text-right pr-6"
                        disabled={splits.find(s => s.personId === p.id)?.amount === 0}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                        {splitType === "percentage" ? "%" : "₹"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={!currentSimulatedExpense} className="w-full h-12 bg-accent hover:bg-accent/80 text-accent-foreground font-bold text-base rounded-xl">
                Confirm Transaction
              </Button>
            </DialogFooter>
          </form>

          <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 border border-primary/10 flex flex-col h-full min-h-[250px]">
            <h3 className="font-headline text-lg text-accent flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5" /> Settlement Simulation
            </h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <div className="relative">
                <Label className="text-[10px] uppercase tracking-widest text-accent mb-2 block font-bold">Projected Outcome</Label>
                {!currentSimulatedExpense ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 border-2 border-dashed border-border/20 rounded-xl">
                    <Info className="w-8 h-8 mb-2" />
                    <p className="text-xs text-center px-4">Fill transaction details to see simulation</p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {simulation.simulatedDebts.length === 0 ? (
                      <div className="text-center py-6 bg-accent/10 border border-accent/20 rounded-xl">
                        <p className="text-sm font-bold text-accent italic">This expense settles all debts!</p>
                      </div>
                    ) : (
                      simulation.simulatedDebts.map((debt, i) => {
                        const isNewOrChanged = !simulation.currentDebts.some(cd => 
                          cd.from === debt.from && cd.to === debt.to && Math.abs(cd.amount - debt.amount) < 0.01
                        );
                        return (
                          <div key={i} className={`text-[11px] sm:text-xs flex justify-between items-center p-2 rounded-lg border transition-colors ${isNewOrChanged ? 'bg-accent/10 border-accent/30' : 'bg-background/40 border-transparent'}`}>
                            <span className={isNewOrChanged ? 'font-bold' : ''}>
                              {getPersonName(debt.from)} <ArrowRight className="inline w-3 h-3 mx-1 opacity-50" /> {getPersonName(debt.to)}
                            </span>
                            <span className={`font-bold ${isNewOrChanged ? 'text-accent' : ''}`}>₹{debt.amount.toFixed(0)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground mt-4 italic text-center">
              Simulation calculates minimal transactions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
