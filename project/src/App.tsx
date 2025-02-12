import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';

function App() {
  const stats = useMemo(() => {
    const times = [2,2,2,2,2,3,3,3,2,3,3,8,2,2,2,2,2,2,3,6,12,7,24,24,9,28,4,14,11,4,61,3,6,13,9,15,8,17,11,6,10,5,3,3,4,2,2,2,10,3];
    
    // Sort times for calculations
    const sortedTimes = [...times].sort((a, b) => a - b);
    const len = sortedTimes.length;
    
    // Calculate quartiles and other stats
    const q1 = sortedTimes[Math.floor(len * 0.25)];
    const q2 = sortedTimes[Math.floor(len * 0.5)];
    const q3 = sortedTimes[Math.floor(len * 0.75)];
    const max = Math.max(...times);
    const min = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / len;
    
    // Calculate frequency distribution
    const freqDist = times.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {});
    
    // Most common response times
    const commonTimes = Object.entries(freqDist)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([time, freq]) => ({ time: Number(time), frequency: freq }));

    return {
      quartiles: [
        { x: "Q1", y: q1, label: `≤${q1}ms` },
        { x: "Q2", y: q2, label: `≤${q2}ms` },
        { x: "Q3", y: q3, label: `≤${q3}ms` },
        { x: "Max", y: max, label: `${max}ms` }
      ],
      stats: {
        min,
        max,
        avg: Math.round(avg * 10) / 10,
        commonTimes
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <LineChart className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">API Response Time Distribution</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-blue-800 mb-2">Response Time Stats</h2>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">Min: {stats.stats.min}ms</p>
              <p className="text-sm text-blue-700">Avg: {stats.stats.avg}ms</p>
              <p className="text-sm text-blue-700">Max: {stats.stats.max}ms</p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-green-800 mb-2">Most Common Response Times</h2>
            <div className="space-y-1">
              {stats.stats.commonTimes.map((item, i) => (
                <p key={i} className="text-sm text-green-700">
                  {item.time}ms ({item.frequency} requests)
                </p>
              ))}
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-purple-800 mb-2">Performance Thresholds</h2>
            <div className="space-y-1">
              <p className="text-sm text-purple-700">25% under {stats.quartiles[0].y}ms</p>
              <p className="text-sm text-purple-700">50% under {stats.quartiles[1].y}ms</p>
              <p className="text-sm text-purple-700">75% under {stats.quartiles[2].y}ms</p>
            </div>
          </div>
        </div>
        
        <div className="relative h-80 mb-6">
          {/* Graph Container */}
          <div className="absolute inset-0">
            {/* Y-axis */}
            <div className="absolute left-12 top-0 bottom-8 border-r border-gray-300 flex flex-col justify-between">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <span className="text-sm text-gray-600 -translate-x-2">
                    {Math.round(stats.quartiles[3].y * (5 - i) / 5)}ms
                  </span>
                  <div className="w-2 h-px bg-gray-300 translate-x-px" />
                </div>
              ))}
            </div>
            
            {/* X-axis */}
            <div className="absolute left-12 right-8 bottom-0 border-t border-gray-300 flex justify-between">
              {stats.quartiles.map((point, i) => (
                <div key={i} className="text-center">
                  <div className="w-px h-2 bg-gray-300 -translate-y-px mx-auto" />
                  <span className="text-sm text-gray-600 block mt-1">{point.x}</span>
                  <span className="text-xs text-gray-500 block">{point.label}</span>
                </div>
              ))}
            </div>
            
            {/* Line Graph */}
            <svg 
              className="absolute left-12 right-8 top-0 bottom-8" 
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {/* Data points */}
              {stats.quartiles.map((point, i) => {
                const x = (i / (stats.quartiles.length - 1)) * 100;
                const y = 100 - (point.y / stats.quartiles[3].y) * 100;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2"
                    className="fill-blue-500"
                  />
                );
              })}
              
              {/* Line connecting points */}
              <path
                d={stats.quartiles.map((point, i) => {
                  const x = (i / (stats.quartiles.length - 1)) * 100;
                  const y = 100 - (point.y / stats.quartiles[3].y) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                className="stroke-blue-500 stroke-2 fill-none"
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Value labels */}
              {stats.quartiles.map((point, i) => {
                const x = (i / (stats.quartiles.length - 1)) * 100;
                const y = 100 - (point.y / stats.quartiles[3].y) * 100;
                return (
                  <text
                    key={i}
                    x={x}
                    y={y - 5}
                    textAnchor="middle"
                    className="fill-gray-600 text-[4px]"
                  >
                    {point.y}ms
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Key Insights</h2>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            <li>Most requests ({stats.stats.commonTimes[0].frequency}) complete in {stats.stats.commonTimes[0].time}ms</li>
            <li>Average response time is {stats.stats.avg}ms</li>
            <li>75% of requests complete in under {stats.quartiles[2].y}ms</li>
            <li>Response times range from {stats.stats.min}ms to {stats.stats.max}ms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;