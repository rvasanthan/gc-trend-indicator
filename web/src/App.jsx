import { useState, useEffect, useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line, ReferenceLine
} from 'recharts'
import './App.css'

const CATEGORIES = [
  { id: 'overview', label: 'Overview', icon: '📊', color: '#6366f1' },
  { id: '1st', label: 'EB-1 Priority', icon: '💎', color: '#3B82F6' },
  { id: '2nd', label: 'EB-2 Advanced', icon: '🌟', color: '#8B5CF6' },
  { id: '3rd', label: 'EB-3 Skilled', icon: '⚡', color: '#F97316' }
]

function App() {
  const [data, setData] = useState([])
  const [chartData, setChartData] = useState({})
  const [projectionData, setProjectionData] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [overviewType, setOverviewType] = useState('final') // 'final' or 'filing'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('data.json')
      .then(res => res.json())
      .then(jsonData => {
        setData(jsonData)
        processData(jsonData)
        setTimeout(() => setLoading(false), 800) // Smooth transition
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [])

  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'C' || dateStr === 'U') return null
    const day = parseInt(dateStr.substring(0, 2))
    const month = dateStr.substring(2, 5)
    const year = parseInt('20' + dateStr.substring(5, 7))
    return new Date(year, monthToNum(month), day)
  }

  const monthToNum = (month) => {
    const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 }
    return months[month.toUpperCase()] || 0
  }

  const processData = (jsonData) => {
    const cats = [
      { key: '1st', finalAction: 'india_1st', filing: 'india_1st_filing', label: 'EB-1' },
      { key: '2nd', finalAction: 'india_2nd', filing: 'india_2nd_filing', label: 'EB-2' },
      { key: '3rd', finalAction: 'india_3rd', filing: 'india_3rd_filing', label: 'EB-3' }
    ]

    const allChartData = {}

    cats.forEach(cat => {
      const monthlyData = {}
      
      jsonData.forEach(entry => {
        const key = `${entry.year}-${String(entry.month_num).padStart(2, '0')}`
        const date = new Date(entry.year, entry.month_num - 1, 1)
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            date: date.toISOString().split('T')[0],
            year: entry.year,
            month: entry.month_num,
            timestamp: date.getTime(),
            category: cat.label,
            avgFinalAction: null,
            avgFilingDate: null,
            finalActionDates: [],
            filingDates: []
          }
        }

        if (entry[cat.finalAction] && entry[cat.finalAction] !== 'C' && entry[cat.finalAction] !== 'U') {
          const d = parseDate(entry[cat.finalAction])
          if (d) monthlyData[key].finalActionDates.push(d.getTime())
        }
        if (entry[cat.filing] && entry[cat.filing] !== 'C' && entry[cat.filing] !== 'U') {
          const d = parseDate(entry[cat.filing])
          if (d) monthlyData[key].filingDates.push(d.getTime())
        }
      })

      const processed = Object.values(monthlyData)
        .filter(m => m.finalActionDates.length > 0 || m.filingDates.length > 0)
        .map(m => ({
          ...m,
          avgFinalAction: m.finalActionDates.length > 0 ? m.finalActionDates.reduce((a, b) => a + b, 0) / m.finalActionDates.length : null,
          avgFilingDate: m.filingDates.length > 0 ? m.filingDates.reduce((a, b) => a + b, 0) / m.filingDates.length : null,
        }))
        .sort((a, b) => a.timestamp - b.timestamp)

      allChartData[cat.key] = processed
      generateProjections(processed, cat.key, cat.label)
    })

    setChartData(allChartData)
  }

  const generateProjections = (processed, categoryKey, categoryLabel) => {
    if (processed.length < 2) return

    const validFinalActions = processed.filter(m => m.avgFinalAction !== null)
    const validFilingDates = processed.filter(m => m.avgFilingDate !== null)

    const project = (data, startYear, endYear) => {
      if (data.length < 2) return []
      
      const x = data.map((_, i) => i)
      const y = data.map(d => d)
      
      const n = data.length
      const sumX = x.reduce((a, b) => a + b, 0)
      const sumY = y.reduce((a, b) => a + b, 0)
      const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0)
      const sumXX = x.reduce((s, xi) => s + xi * xi, 0)
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n

      const results = []
      for (let year = startYear; year <= endYear; year++) {
        const idx = year - startYear + data.length
        results.push({
          year,
          timestamp: new Date(year, 0, 1).getTime(),
          value: intercept + slope * idx
        })
      }
      return results
    }

    const lastYear = processed[processed.length - 1].year
    const faValues = validFinalActions.slice(-12).map(m => m.avgFinalAction)
    const fdValues = validFilingDates.slice(-12).map(m => m.avgFilingDate)

    const faProjections = project(faValues, lastYear + 1, 2035)
    const fdProjections = project(fdValues, lastYear + 1, 2035)

    const projData = faProjections.map((fa, i) => ({
      year: fa.year,
      timestamp: fa.timestamp,
      category: categoryLabel,
      projectedFinalAction: fa.value,
      projectedFilingDate: fdProjections[i]?.value,
      isProjection: true
    }))

    setProjectionData(prev => ({
      ...prev,
      [categoryKey]: projData
    }))
  }

  const latestDates = useMemo(() => {
    if (!data || data.length === 0) return {}
    const latest = data[data.length - 1]
    return {
      '1st': { final: latest.india_1st, filing: latest.india_1st_filing },
      '2nd': { final: latest.india_2nd, filing: latest.india_2nd_filing },
      '3rd': { final: latest.india_3rd, filing: latest.india_3rd_filing }
    }
  }, [data])

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'C' || dateStr === 'U') return dateStr || 'N/A'
    const day = dateStr.substring(0, 2)
    const month = dateStr.substring(2, 5)
    const year = '20' + dateStr.substring(5, 7)
    return `${month} ${day}, ${year}`
  }

  const formatYear = (tick) => new Date(tick).getFullYear()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label)
      return (
        <div className="glass p-4 border border-white/50 shadow-2xl rounded-2xl backdrop-blur-xl">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
            {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <div className="space-y-3">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-10">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                  <p className="text-xs font-bold text-slate-600">{entry.name}</p>
                </div>
                <p className="text-xs font-black text-slate-900">
                  {new Date(entry.value).getFullYear()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-indigo-500/10 rounded-full"></div>
          <div className="absolute top-0 w-20 h-20 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-6 text-xs font-black text-indigo-600 uppercase tracking-[0.3em] animate-pulse">Initializing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-mesh text-slate-900 font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <aside className="fixed left-6 top-6 bottom-6 w-20 lg:w-72 glass rounded-[2.5rem] border border-white/40 shadow-2xl shadow-indigo-100/50 z-50 transition-all duration-500 overflow-hidden">
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-16 px-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-200 animate-float">
              <span className="text-white">✨</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-black tracking-tighter text-slate-900">US Immigration</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Data Analysis</p>
            </div>
          </div>
          
          <nav className="space-y-3 flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-500 group relative ${
                  activeTab === cat.id 
                    ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' 
                    : 'text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-lg hover:shadow-slate-100'
                }`}
              >
                <span className={`text-xl transition-transform duration-500 group-hover:scale-125 ${activeTab === cat.id ? 'scale-110' : ''}`}>
                  {cat.icon}
                </span>
                <span className="font-bold text-sm hidden lg:block tracking-tight">{cat.label}</span>
                {activeTab === cat.id && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse hidden lg:block"></div>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100 hidden lg:block">
            <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Live Status</p>
              </div>
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">All systems operational. Data synced with USCIS.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-80 p-6 lg:p-12 transition-all duration-500">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-3">
                {CATEGORIES.find(c => c.id === activeTab)?.label}
              </h2>
              <p className="text-slate-400 font-medium text-lg">
                {activeTab === 'overview' 
                  ? 'Real-time visa priority trends and predictive modeling.' 
                  : `Detailed analysis and projections for ${CATEGORIES.find(c => c.id === activeTab)?.label} category.`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="glass px-6 py-3 rounded-2xl border border-white/60 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">RV</div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Welcome back</p>
                  <p className="text-xs font-bold text-slate-700">Vasanthan</p>
                </div>
              </div>
            </div>
          </header>

          {activeTab === 'overview' ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['1st', '2nd', '3rd'].map(id => {
                  const cat = CATEGORIES.find(c => c.id === id)
                  const dates = latestDates[id]
                  return (
                    <div key={id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                      <div className="relative glass p-10 rounded-[2.5rem] border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-center justify-between mb-10">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                            {cat.icon}
                          </div>
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                        </div>
                        <div className="space-y-8">
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Final Action</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatDate(dates?.final)}</p>
                          </div>
                          <div className="pt-8 border-t border-slate-50">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Filing Date</p>
                            <p className="text-xl font-bold text-slate-600 tracking-tight">{formatDate(dates?.filing)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Main Chart */}
              <div className="glass p-12 rounded-[3.5rem] border border-white/60 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Market Trajectory</h3>
                    <p className="text-slate-400 font-medium">Comparative historical analysis across all categories</p>
                  </div>
                  <div className="flex flex-col items-end gap-6">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                      <button 
                        onClick={() => setOverviewType('final')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${overviewType === 'final' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Final Action
                      </button>
                      <button 
                        onClick={() => setOverviewType('filing')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${overviewType === 'filing' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Filing Date
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      {['1st', '2nd', '3rd'].map(id => (
                        <div key={id} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CATEGORIES.find(c => c.id === id).color }}></div>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{CATEGORIES.find(c => c.id === id).label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <defs>
                        {['1st', '2nd', '3rd'].map(id => (
                          <filter key={`shadow-${id}`} id={`shadow-${id}`} height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                            <feOffset dx="0" dy="4" result="offsetblur" />
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                              <feMergeNode />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="12 12" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="timestamp" 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatYear}
                        stroke="#cbd5e1"
                        fontSize={10}
                        fontWeight={900}
                        tickLine={false}
                        axisLine={false}
                        dy={15}
                      />
                      <YAxis 
                        domain={[new Date(2005, 0, 1).getTime(), 'auto']}
                        tickFormatter={(val) => new Date(val).getFullYear()}
                        stroke="#cbd5e1"
                        fontSize={10}
                        fontWeight={900}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '8 8' }} />
                      {['1st', '2nd', '3rd'].map(id => (
                        <Line
                          key={id}
                          data={chartData[id]}
                          type="monotone"
                          dataKey={overviewType === 'final' ? "avgFinalAction" : "avgFilingDate"}
                          name={CATEGORIES.find(c => c.id === id).label}
                          stroke={CATEGORIES.find(c => c.id === id).color}
                          strokeWidth={5}
                          dot={false}
                          activeDot={{ r: 10, strokeWidth: 4, stroke: '#fff', fill: CATEGORIES.find(c => c.id === id).color }}
                          filter={`url(#shadow-${id})`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* Category Detail Header */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-12 rounded-[3rem] border border-white/60 shadow-xl flex flex-col justify-center">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-4xl shadow-2xl shadow-slate-200 animate-float">
                      {CATEGORIES.find(c => c.id === activeTab).icon}
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        {CATEGORIES.find(c => c.id === activeTab).label} Analysis
                      </h3>
                      <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Predictive Modeling Active</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                    Our algorithmic engine analyzes historical USCIS data to project future priority date movements. 
                    The dashed lines represent our 10-year predictive trajectory.
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="glass p-8 rounded-[2.5rem] border border-white/60 shadow-lg">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Current Final Action</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatDate(latestDates[activeTab]?.final)}</p>
                  </div>
                  <div className="glass p-8 rounded-[2.5rem] border border-white/60 shadow-lg">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Current Filing Date</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatDate(latestDates[activeTab]?.filing)}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Charts */}
              <div className="grid grid-cols-1 gap-12">
                {/* Trajectory Chart */}
                <div className="glass p-12 rounded-[3.5rem] border border-white/60 shadow-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Trajectory</h3>
                      <p className="text-slate-400 font-medium">Combined analysis of Final Action and Filing Dates</p>
                    </div>
                    <div className="flex flex-wrap gap-8">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CATEGORIES.find(c => c.id === activeTab).color }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Action</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm bg-emerald-500"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filing Date</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full border-2 border-dashed shadow-sm" style={{ borderColor: '#94a3b8' }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projections</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CATEGORIES.find(c => c.id === activeTab).color} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={CATEGORIES.find(c => c.id === activeTab).color} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFD" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="12 12" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="timestamp" 
                          type="number"
                          domain={['auto', 'auto']}
                          tickFormatter={formatYear}
                          stroke="#cbd5e1"
                          fontSize={10}
                          fontWeight={900}
                          tickLine={false}
                          axisLine={false}
                          dy={15}
                        />
                        <YAxis 
                          domain={[new Date(2005, 0, 1).getTime(), 'auto']}
                          tickFormatter={(val) => new Date(val).getFullYear()}
                          stroke="#cbd5e1"
                          fontSize={10}
                          fontWeight={900}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '8 8' }} />
                        
                        {/* Filing Date Area */}
                        <Area 
                          data={chartData[activeTab]}
                          type="monotone" 
                          dataKey="avgFilingDate" 
                          name="Filing Date"
                          stroke="#10B981" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorFD)" 
                          animationDuration={2500}
                        />
                        <Area 
                          data={projectionData[activeTab]}
                          type="monotone" 
                          dataKey="projectedFilingDate" 
                          name="Projected Filing"
                          stroke="#10B981" 
                          strokeWidth={3}
                          strokeDasharray="8 8"
                          fill="transparent"
                        />

                        {/* Final Action Area */}
                        <Area 
                          data={chartData[activeTab]}
                          type="monotone" 
                          dataKey="avgFinalAction" 
                          name="Final Action"
                          stroke={CATEGORIES.find(c => c.id === activeTab).color} 
                          strokeWidth={6}
                          fillOpacity={1} 
                          fill="url(#colorFA)" 
                          animationDuration={2500}
                        />
                        <Area 
                          data={projectionData[activeTab]}
                          type="monotone" 
                          dataKey="projectedFinalAction" 
                          name="Projected Final Action"
                          stroke={CATEGORIES.find(c => c.id === activeTab).color} 
                          strokeWidth={4}
                          strokeDasharray="12 12"
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
