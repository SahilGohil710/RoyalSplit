"use client";

import React, { useState, useMemo } from "react";
import { Person, Expense, Debt, Balance } from "@/lib/types";
import { calculateBalances, simplifyDebts, calculateDirectDebts } from "@/lib/split-logic";
import { ExpenseForm } from "./ExpenseForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crown, 
  Users, 
  History, 
  ArrowRightLeft, 
  UserPlus, 
  Trash2, 
  CreditCard,
  CheckCircle2,
  TrendingDown,
  ArrowRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function RoyalSplitApp() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [isSimplified, setIsSimplified] = useState(true);

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    const newPerson: Person = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPersonName.trim(),
    };
    setPeople([...people, newPerson]);
    setNewPersonName("");
  };

  const removePerson = (id: string) => {
    setPeople(people.filter((p) => p.id !== id));
    setExpenses(expenses.filter(e => e.paidBy !== id && !e.splits.some(s => s.personId === id)));
  };

  const addExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // Always recalculated from scratch
  const balances = useMemo(() => calculateBalances(people, expenses), [people, expenses]);
  
  const debts = useMemo(() => {
    if (isSimplified) {
      return simplifyDebts(balances);
    } else {
      return calculateDirectDebts(people, expenses);
    }
  }, [isSimplified, balances, people, expenses]);

  const settleDebt = (debt: Debt) => {
    const settlementExpense: Expense = {
      id: `settle-${Date.now()}`,
      title: `Settlement Payment`,
      amount: debt.amount,
      paidBy: debt.from,
      splitType: 'unequal',
      splits: [{ personId: debt.to, amount: debt.amount }],
      date: Date.now(),
    };
    addExpense(settlementExpense);
  };

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name || "Unknown";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 border border-accent/20">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-headline text-accent">RoyalSplit</h1>
            <p className="text-muted-foreground text-sm tracking-widest uppercase">Premium Expense Sovereignty</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Input 
              placeholder="Add Royal Member..." 
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPerson()}
              className="pl-4 pr-12 py-6 bg-card border-border rounded-xl focus:ring-accent"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={addPerson}
              className="absolute right-1 top-1 text-accent hover:text-accent hover:bg-transparent"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
          {people.length > 0 && (
            <ExpenseForm people={people} onAddExpense={addExpense} />
          )}
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <Card className="shadow-xl border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Royal Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-2">
              <ScrollArea className="h-[300px] px-4">
                {people.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Invite members to your court.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {people.map(person => {
                      const balance = balances.find(b => b.personId === person.id)?.netAmount || 0;
                      return (
                        <div key={person.id} className="group flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-primary/20">
                          <div className="flex flex-col">
                            <span className="font-bold">{person.name}</span>
                            <span className={`text-sm ${balance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                              {balance >= 0 ? `Is owed ₹${balance.toFixed(2)}` : `Owes ₹${Math.abs(balance).toFixed(2)}`}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => removePerson(person.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-accent/10">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-accent" /> Settlement
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="simplified-debt" 
                    checked={isSimplified} 
                    onCheckedChange={setIsSimplified}
                  />
                  <Label htmlFor="simplified-debt" className="text-[10px] uppercase tracking-tighter cursor-pointer text-muted-foreground">
                    Simplified
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {debts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-accent opacity-40" />
                    <p className="text-sm italic">The realm is fully settled.</p>
                  </div>
                ) : (
                  debts.map((debt, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm leading-relaxed">
                          <span className="font-bold text-foreground">{getPersonName(debt.from)}</span> 
                          <span className="text-muted-foreground mx-1">owes</span> 
                          <span className="font-bold text-foreground">{getPersonName(debt.to)}</span>
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-2xl font-headline text-accent">₹{debt.amount.toFixed(2)}</span>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => settleDebt(debt)}
                            className="text-xs bg-accent text-accent-foreground hover:bg-accent/80 font-bold"
                          >
                            Settle
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full shadow-2xl border-primary/10">
            <CardHeader className="border-b border-border/50 bg-primary/5">
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <History className="w-6 h-6 text-accent" /> Transaction Chronicle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-50 space-y-4">
                    <CreditCard className="w-16 h-16" />
                    <p className="font-headline text-lg">Your ledger is currently empty.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="group p-6 hover:bg-secondary/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-primary/10 min-w-[60px] border border-primary/20">
                            <span className="text-xs uppercase font-bold text-accent">{new Date(expense.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl font-headline">{new Date(expense.date).getDate()}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors">
                              {expense.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Paid by <span className="text-foreground font-medium">{getPersonName(expense.paidBy)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-2xl font-headline text-accent">₹{expense.amount.toFixed(2)}</p>
                            <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">{expense.splitType} split</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-20 py-8 text-center text-muted-foreground/40 text-sm">
        <Separator className="mb-6 opacity-10" />
        <p>&copy; {new Date().getFullYear()} RoyalSplit &bull; Premium Expense Sovereignty &bull; Accurate Greedy Settlement</p>
      </footer>
    </div>
  );
}
