"use client";

import React, { useState, useMemo } from "react";
import { Person, Expense, Debt, Balance } from "@/lib/types";
import { calculateBalances, simplifyDebts, calculateDirectDebts, calculateBalanceHistory, round } from "@/lib/split-logic";
import { ExpenseForm } from "./ExpenseForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  TrendingUp,
  Table as TableIcon,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = [
  "#F7D56E", // Gold
  "#3333CC", // Royal Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#EF4444"  // Red
];

export default function RoyalSplitApp() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [isSimplified, setIsSimplified] = useState(true);
  const [expandedExpenses, setExpandedExpenses] = useState<Record<string, boolean>>({});

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

  const toggleExpenseDetails = (id: string) => {
    setExpandedExpenses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const balances = useMemo(() => calculateBalances(people, expenses), [people, expenses]);
  const debts = useMemo(() => isSimplified ? simplifyDebts(balances) : calculateDirectDebts(people, expenses), [isSimplified, balances, people, expenses]);
  const historyData = useMemo(() => calculateBalanceHistory(people, expenses), [people, expenses]);

  const pieData = useMemo(() => {
    const netPositive = balances.filter(b => b.netAmount > 0).map(b => ({
      name: people.find(p => p.id === b.personId)?.name || 'Unknown',
      value: b.netAmount
    }));
    return netPositive;
  }, [balances, people]);

  const settleDebt = (debt: Debt) => {
    const settlementExpense: Expense = {
      id: `settle-${Date.now()}`,
      title: `Settlement: ${getPersonName(debt.from)} to ${getPersonName(debt.to)}`,
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
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-6">
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="p-2 md:p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 border border-accent/20">
            <Crown className="w-6 h-6 md:w-8 md:h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-headline text-accent leading-none">RoyalSplit</h1>
            <p className="text-muted-foreground text-[10px] md:text-sm tracking-widest uppercase mt-1">Premium Expense Sovereignty</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Input 
              placeholder="Add Royal Member..." 
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPerson()}
              className="pl-4 pr-12 h-12 md:h-14 bg-card border-border rounded-xl focus:ring-accent text-base"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={addPerson}
              className="absolute right-1 top-1 h-10 w-10 md:h-12 md:w-12 text-accent hover:text-accent hover:bg-transparent"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
          {people.length > 0 && (
            <ExpenseForm people={people} currentExpenses={expenses} onAddExpense={addExpense} />
          )}
        </div>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: People & Settlements */}
          <div className="lg:col-span-4 flex flex-col gap-8 order-1">
            {/* Ledger Table - Scrollable on mobile */}
            <Card className="shadow-xl border-primary/10 overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg md:text-xl font-headline flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-accent" /> Members Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[250px] md:max-h-none overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                      <TableRow className="border-border/50">
                        <TableHead className="font-headline text-[10px] md:text-xs">Member</TableHead>
                        <TableHead className="text-right font-headline text-[10px] md:text-xs">Paid</TableHead>
                        <TableHead className="text-right font-headline text-[10px] md:text-xs">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {people.map(person => {
                        const balance = balances.find(b => b.personId === person.id);
                        return (
                          <TableRow key={person.id} className="border-border/30 hover:bg-primary/5">
                            <TableCell className="font-medium py-3 text-sm">{person.name}</TableCell>
                            <TableCell className="text-right py-3 text-xs">₹{balance?.paid.toFixed(0)}</TableCell>
                            <TableCell className={`text-right py-3 font-bold text-sm ${balance && balance.netAmount >= 0 ? 'text-accent' : 'text-destructive'}`}>
                              ₹{Math.abs(balance?.netAmount || 0).toFixed(0)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {people.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">No members added yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settlements */}
            <Card className="shadow-xl border-accent/10 order-2">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg md:text-xl font-headline flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-accent" /> Settlements
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
                            <span className="text-xl md:text-2xl font-headline text-accent">₹{debt.amount.toFixed(2)}</span>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => settleDebt(debt)}
                              className="text-xs h-9 bg-accent text-accent-foreground hover:bg-accent/80 font-bold px-4"
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

          {/* Right Column: Transaction History */}
          <div className="lg:col-span-8 order-2 lg:order-2">
            <Card className="h-full shadow-2xl border-primary/10">
              <CardHeader className="border-b border-border/50 bg-primary/5">
                <CardTitle className="text-xl md:text-2xl font-headline flex items-center gap-2">
                  <History className="w-6 h-6 text-accent" /> Transaction Chronicle
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] md:h-[700px]">
                  {expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-muted-foreground opacity-50 space-y-4 text-center">
                      <CreditCard className="w-12 h-12 md:w-16 md:h-16" />
                      <p className="font-headline text-base md:text-lg px-4">Your ledger is currently empty.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {expenses.map((expense) => {
                        const isExpanded = expandedExpenses[expense.id];
                        const participantsCount = expense.splits.filter(s => s.amount > 0).length;
                        const totalPeople = people.length;
                        const isSubset = participantsCount < totalPeople && participantsCount > 0;
                        const participantNames = expense.splits
                          .filter(s => s.amount > 0)
                          .map(s => getPersonName(s.personId));

                        return (
                          <div key={expense.id} className="group transition-all">
                            <div 
                              className="p-4 md:p-6 hover:bg-secondary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                              onClick={() => toggleExpenseDetails(expense.id)}
                            >
                              <div className="flex gap-4 w-full sm:w-auto">
                                <div className="hidden sm:flex flex-col items-center justify-center p-2 rounded-lg bg-primary/10 min-w-[60px] border border-primary/20 h-fit">
                                  <span className="text-[10px] uppercase font-bold text-accent">{new Date(expense.date).toLocaleString('default', { month: 'short' })}</span>
                                  <span className="text-lg font-headline">{new Date(expense.date).getDate()}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base md:text-lg leading-tight group-hover:text-accent transition-colors">
                                      {expense.title}
                                    </h3>
                                    {isSubset && (
                                      <Info className="w-3 h-3 text-accent/60" />
                                    )}
                                  </div>
                                  <div className="sm:hidden text-[10px] text-muted-foreground mb-1">
                                    {new Date(expense.date).toLocaleDateString()}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Paid by <span className="text-foreground font-medium">{getPersonName(expense.paidBy)}</span>
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-0.5 rounded">
                                      {isSubset ? `Split with ${participantsCount} members` : "Split among all"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                <div className="text-left sm:text-right">
                                  <p className="text-lg md:text-2xl font-headline text-accent leading-none">₹{expense.amount.toFixed(2)}</p>
                                  <div className="flex items-center gap-1 sm:justify-end mt-1">
                                    <span className="text-[10px] text-muted-foreground">View details</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-muted-foreground hover:text-destructive opacity-40 hover:opacity-100 h-10 w-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeExpense(expense.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <Collapsible open={isExpanded}>
                              <CollapsibleContent>
                                <div className="px-4 md:px-6 pb-6 pt-2 bg-primary/5 border-t border-border/20">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                    <div className="space-y-3">
                                      <h4 className="font-headline text-accent uppercase tracking-tighter text-[10px] md:text-xs">Share Breakdown</h4>
                                      <div className="space-y-2">
                                        {expense.splits.filter(s => s.amount > 0).map(split => {
                                          let shareDisplay = "";
                                          if (expense.splitType === 'equal') {
                                            shareDisplay = `₹${(expense.amount / participantsCount).toFixed(2)}`;
                                          } else if (expense.splitType === 'unequal') {
                                            shareDisplay = `₹${split.amount.toFixed(2)}`;
                                          } else {
                                            shareDisplay = `${split.amount}% (₹${((split.amount / 100) * expense.amount).toFixed(2)})`;
                                          }

                                          return (
                                            <div key={split.personId} className="flex justify-between items-center border-b border-border/10 pb-1">
                                              <span className="text-xs">{getPersonName(split.personId)}</span>
                                              <span className="font-mono text-[10px] md:text-xs">{shareDisplay}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <h4 className="font-headline text-accent uppercase tracking-tighter text-[10px] md:text-xs">Participants</h4>
                                      <div className="flex flex-wrap gap-1.5">
                                        {participantNames.map((name, i) => (
                                          <Badge key={i} variant="secondary" className="bg-background/50 border-border text-[10px] px-2 py-0">
                                            {name}
                                          </Badge>
                                        ))}
                                      </div>
                                      <div className="text-muted-foreground text-[10px] md:text-xs space-y-1 mt-4">
                                        <p><span className="font-bold text-foreground">Method:</span> {expense.splitType.charAt(0).toUpperCase() + expense.splitType.slice(1)}</p>
                                        <p><span className="font-bold text-foreground">Time:</span> {new Date(expense.date).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section - Reordered to bottom on mobile */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 order-3">
            <Card className="border-primary/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg md:text-xl font-headline flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" /> Balance Evolution
                </CardTitle>
                <CardDescription className="text-xs">Track net worth changes across transactions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={8} 
                      tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                    />
                    <YAxis stroke="#888888" fontSize={8} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '10px' }}
                      labelStyle={{ color: 'hsl(var(--accent))' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    {people.map((p, idx) => (
                      <Line 
                        key={p.id} 
                        type="monotone" 
                        dataKey={p.name} 
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg md:text-xl font-headline flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-accent" /> Credit Distribution
                </CardTitle>
                <CardDescription className="text-xs">Total amount owed to active creditors</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-[250px] md:h-[300px] flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => `₹${val.toFixed(2)}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '10px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No credits to display</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="mt-12 md:mt-20 py-8 text-center text-muted-foreground/40 text-[10px] md:text-sm w-full max-w-6xl px-4">
        <Separator className="mb-6 opacity-10" />
        <p>&copy; {new Date().getFullYear()} RoyalSplit &bull; Premium Expense Sovereignty &bull; Accurate Greedy Settlement</p>
      </footer>
    </div>
  );
}
