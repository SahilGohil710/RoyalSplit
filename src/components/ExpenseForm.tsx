"use client";

import React, { useState, useEffect } from "react";
import { Person, SplitType, ExpenseSplit, Expense } from "@/lib/types";
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
import { Crown, Plus } from "lucide-react";

interface ExpenseFormProps {
  people: Person[];
  onAddExpense: (expense: Expense) => void;
}

export function ExpenseForm({ people, onAddExpense }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);

  useEffect(() => {
    if (open) {
      // Default to everyone participating with equal amount 1 (for count)
      setSplits(people.map((p) => ({ personId: p.id, amount: 1 })));
      if (people.length > 0 && !paidBy) setPaidBy(people[0].id);
    }
  }, [open, people, paidBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title || isNaN(numAmount) || !paidBy) return;

    // Filter out participants who are not included (amount 0)
    const finalSplits = splits.filter(s => s.amount > 0);
    
    // If equal split, ensure at least one person is selected
    if (splitType === "equal" && finalSplits.length === 0) {
      alert("Please select at least one person for the split.");
      return;
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      amount: numAmount,
      paidBy,
      splitType,
      splits: finalSplits,
      date: Date.now(),
    };

    onAddExpense(newExpense);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-primary/20 bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-accent flex items-center gap-2">
            <Crown className="w-6 h-6" /> Royal Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground">Description</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dinner, Flight, Palace Rent..."
              className="bg-background border-border focus:ring-accent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-muted-foreground">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-background border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Paid By</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="bg-background border-border">
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

          <div className="space-y-2">
            <Label className="text-muted-foreground">Split Method</Label>
            <Select value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Split Equally</SelectItem>
                <SelectItem value="unequal">Exact Amounts (₹)</SelectItem>
                <SelectItem value="percentage">Percentages (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {people.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`check-${p.id}`}
                    checked={splits.find(s => s.personId === p.id)?.amount !== 0}
                    onCheckedChange={() => toggleEqualParticipant(p.id)}
                  />
                  <Label htmlFor={`check-${p.id}`} className="text-sm">{p.name}</Label>
                </div>
                {splitType !== "equal" && (
                  <div className="relative w-24">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={splitType === "percentage" ? "%" : "₹"}
                      value={splits.find(s => s.personId === p.id)?.amount || ""}
                      onChange={(e) => updateSplitAmount(p.id, e.target.value)}
                      className="h-8 text-right pr-6"
                      disabled={splits.find(s => s.personId === p.id)?.amount === 0}
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-muted-foreground pointer-events-none">
                      {splitType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold">
              Confirm Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
