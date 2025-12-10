import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { COLORS } from '../constants';
import { getDailyAverages, getWells } from '../services/dataService';
import { Well, DailyAverage } from '../types';
import { Droplet, Activity, Cloud, ArrowDownCircle, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [wells, setWells] = useState<Well[]>([]);
  
  // KPI State
  const [kpis, setKpis] = useState({
      totalWells: 0,
      activeWells: 0,
      annualVapor: 0, // Sum of Steam Flow
      annualReinjection: 0 // Sum of Reinjection Flow
  });

  // Charts State
  const [waterBalanceData, setWaterBalanceData] = useState<any[]>([]);
  
  // Line Chart Filter State
  const [selectedWellId, setSelectedWellId] = useState<string>('');
  const [wellChartData, setWellChartData] = useState<any[]>([]);
  const [allAverages, setAllAverages] = useState<DailyAverage[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedWells = await getWells();
      const fetchedAverages = await getDailyAverages();
      
      setWells(fetchedWells);
      setAllAverages(fetchedAverages);

      // --- 1. CALCULATE KPIS ---
      const activeCount = fetchedWells.filter(w => w.status === 'open').length;
      
      // Calculate Annual Totals (Current Year)
      const currentYear = new Date().getFullYear();
      let sumVapor = 0;
      let sumWaterProd = 0;
      let sumWaterReinj = 0;

      fetchedAverages.forEach(d => {
          const date = new Date(d.date);
          if (date.getFullYear() === currentYear) {
              const well = fetchedWells.find(w => w.id === d.wellId);
              if (!well) return;

              // Check Metric Type (Case insensitive check)
              const metric = d.metricType.toLowerCase();
              const isVapor = metric.includes('vapor');
              const isWater = metric.includes('agua');

              // Logic:
              // Vapor Produced = Production Wells + Vapor Metric
              // Water Produced = Production Wells + Water Metric
              // Water Reinjected = Reinjection Wells + Water Metric

              if (well.type === 'production') {
                  if (isVapor) sumVapor += d.avgValue; // Assuming avgValue is daily total or avg rate. 
                  // If it's rate (kg/s), strictly we need * 3600 * 24 * 365, but for Dashboard trends sum is okay for demo
                  // Let's assume the value imported is Daily Mass for simplicity, or we treat sum of rates as an index.
                  // For this requirement "Acum Anual", normally implies Mass. 
                  // If source is kg/s, we estimate: avgValue (kg/s) * 86400 (s/day).
                  if (isWater) sumWaterProd += (d.avgValue * 86400) / 1000; // Convert to Tonnes
                  if (isVapor) sumVapor += (d.avgValue * 86400) / 1000; // Convert to Tonnes
              } else if (well.type === 'reinjection') {
                  if (isWater) sumWaterReinj += (d.avgValue * 86400) / 1000; // Convert to Tonnes
              }
          }
      });

      setKpis({
          totalWells: fetchedWells.length,
          activeWells: activeCount,
          annualVapor: sumVapor,
          annualReinjection: sumWaterReinj
      });

      setWaterBalanceData([
          { name: 'Agua Producida', value: sumWaterProd },
          { name: 'Agua Reinyectada', value: sumWaterReinj }
      ]);

      // Set default selected well for chart
      if (fetchedWells.length > 0) {
          setSelectedWellId(fetchedWells[0].id);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // --- 2. UPDATE LINE CHART WHEN SELECTION CHANGES ---
  useEffect(() => {
      if (!selectedWellId || allAverages.length === 0) return;

      const well = wells.find(w => w.id === selectedWellId);
      const targetMetric = well?.type === 'production' ? 'Vapor' : 'Agua'; // Default interesting metric

      // Filter data for this well
      const wellData = allAverages
        .filter(d => d.wellId === selectedWellId && d.metricType.includes(targetMetric))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(d => ({
            date: d.date,
            value: d.avgValue,
            unit: d.unit
        }));

      setWellChartData(wellData);

  }, [selectedWellId, allAverages, wells]);

  // Formatter for Numbers
  const formatNumber = (num: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(num);

  if (loading) return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-[#1B4079] animate-pulse">
          <Activity size={48} className="mb-4" />
          <span className="text-xl font-bold ml-2">Cargando Dashboard...</span>
      </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1B4079]">Dashboard General</h2>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded shadow-sm">
             Año Actual: {new Date().getFullYear()}
        </span>
      </div>
      
      {/* --- CARDS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <DashboardCard 
            title="Total de Pozos" 
            value={kpis.totalWells.toString()} 
            icon={Droplet} 
            color="bg-[#1B4079]"
        />
        
        <DashboardCard 
            title="Pozos Activos" 
            value={kpis.activeWells.toString()} 
            icon={Activity} 
            color="bg-[#4D7C8A]" 
            subValue={`${kpis.totalWells - kpis.activeWells} Cerrados`}
        />

        <DashboardCard 
            title="Vapor Producido (Acum)" 
            value={`${formatNumber(kpis.annualVapor)} t`} 
            icon={Cloud} 
            color="bg-[#7F9C96]"
            subValue="Toneladas / Año"
        />

        <DashboardCard 
            title="Agua Reinyectada (Acum)" 
            value={`${formatNumber(kpis.annualReinjection)} t`} 
            icon={ArrowDownCircle} 
            color="bg-[#CBDF90]"
            textColor="text-[#1B4079]"
            subValue="Toneladas / Año"
        />

      </div>

      {/* --- CHARTS ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LINE CHART (Filterable) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[#1B4079]">Histórico por Pozo</h3>
                    <p className="text-xs text-gray-500">Tendencia de flujo (Vapor/Agua)</p>
                </div>
                
                {/* WELL SELECTOR */}
                <div className="relative">
                    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                    <select 
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#1B4079] outline-none cursor-pointer"
                        value={selectedWellId}
                        onChange={(e) => setSelectedWellId(e.target.value)}
                    >
                        {wells.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.type === 'production' ? 'Prod' : 'Reiny'})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                {wellChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={wellChartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.yale} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={COLORS.yale} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(str) => format(parseISO(str), 'dd MMM', { locale: es })} 
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(label) => format(parseISO(label), 'dd MMMM yyyy', { locale: es })}
                            />
                            <Area type="monotone" dataKey="value" stroke={COLORS.yale} fillOpacity={1} fill="url(#colorValue)" name="Flujo (kg/s)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Activity size={48} className="opacity-20 mb-2"/>
                        <p>No hay datos de flujo para el pozo seleccionado.</p>
                    </div>
                )}
            </div>
        </div>

        {/* PIE CHART (Balance) */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col">
          <h3 className="text-lg font-bold text-[#1B4079] mb-2">Balance Hídrico Anual</h3>
          <p className="text-xs text-gray-500 mb-6">Comparativa Agua Producida vs Reinyectada</p>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={waterBalanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill={COLORS.airforce} />  {/* Agua Producida */}
                  <Cell fill={COLORS.mindaro} />   {/* Agua Reinyectada */}
                </Pie>
                <Tooltip formatter={(val: number) => `${formatNumber(val)} t`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 bg-gray-50 p-3 rounded text-center">
             <span className="text-xs text-gray-500 block uppercase font-bold">Diferencia (Pérdida/Acum)</span>
             <span className="text-lg font-bold text-gray-700">
                 {formatNumber(Math.abs(waterBalanceData[0]?.value - waterBalanceData[1]?.value))} t
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, icon: Icon, color, subValue, textColor = 'text-white' }: any) => (
    <div className={`${color} p-6 rounded-lg shadow-md flex items-center justify-between transform transition-transform hover:scale-105`}>
        <div>
            <h3 className={`${textColor} opacity-80 text-xs font-bold uppercase tracking-wider`}>{title}</h3>
            <p className={`text-2xl lg:text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
            {subValue && <p className={`text-xs mt-1 ${textColor} opacity-70`}>{subValue}</p>}
        </div>
        <div className={`p-3 rounded-full bg-white/20 ${textColor}`}>
            <Icon size={24} />
        </div>
    </div>
);

export default Dashboard;