"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HistoryData {
  date: string;
  ieltsBand: number;
  toeflScore: number;
  readingScore: number;
  writingScore: number;
  xp: number;
}

interface DashboardChartsProps {
  historyData: HistoryData[];
}

export default function DashboardCharts({ historyData }: DashboardChartsProps) {
  // If no history data yet, show mock data to guide user
  const displayData = historyData.length > 0 ? historyData : [
    { date: "Mulai", ieltsBand: 4.0, toeflScore: 30, readingScore: 40, writingScore: 40, xp: 0 },
  ];

  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-white">Tren Perkembangan Ujian</CardTitle>
          <CardDescription className="text-slate-400">
            Nilai estimasi harian yang dipetakan ke standar TOEFL dan IELTS.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ielts" className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList className="bg-slate-950 border border-slate-800">
              <TabsTrigger value="ielts" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">IELTS Band</TabsTrigger>
              <TabsTrigger value="toefl" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">TOEFL Score</TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Nilai Skill (%)</TabsTrigger>
            </TabsList>
          </div>

          {/* IELTS Area Chart */}
          <TabsContent value="ielts">
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIelts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" domain={[0, 9]} ticks={[0, 2, 4, 5, 6, 7, 8, 9]} fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                    labelClassName="text-slate-400 font-semibold"
                  />
                  <Area type="monotone" dataKey="ieltsBand" name="IELTS Band" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorIelts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* TOEFL Area Chart */}
          <TabsContent value="toefl">
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorToefl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" domain={[0, 120]} ticks={[0, 30, 50, 70, 90, 110, 120]} fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                    labelClassName="text-slate-400 font-semibold"
                  />
                  <Area type="monotone" dataKey="toeflScore" name="TOEFL Score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorToefl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Reading & Writing Progress Chart */}
          <TabsContent value="skills">
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReading" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWriting" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                    labelClassName="text-slate-400 font-semibold"
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="readingScore" name="Membaca (%)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReading)" />
                  <Area type="monotone" dataKey="writingScore" name="Menulis (%)" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorWriting)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
