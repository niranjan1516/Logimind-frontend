import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// Production UI Theme Styles matching a clean dark/light dashboard
const CITIES = ["Mumbai", "Pune", "Kolhapur", "Goa"];

const DemandChart = () => {
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Instantiate an AbortController to cancel stale, out-of-order network requests
    const abortController = new AbortController();
    
    const fetchForecast = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(
          `https://logimind-api.onrender.com/forecast/${selectedCity}`,
          { signal: abortController.signal }
        );

        // Standardize data: Ensure it's an array and format dates from the database
        if (Array.isArray(response.data)) {
          const formattedData = response.data.map(item => ({
            ...item,
            // Format database ISO strings or raw timestamps to readable times/dates
            displayTime: item.timestamp 
              ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : item.time || 'Unknown'
          }));
          setForecastData(formattedData);
        } else {
          // If the API returns a single object payload, wrap it safely
          setForecastData([]);
          console.warn("Expected array format from forecast API, received:", response.data);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          // Silent ignore: The request was intentionally canceled because the user picked a different city
          return;
        }
        console.error(`Error fetching forecast for ${selectedCity}:`, err);
        setError(`Failed to retrieve current logistics metrics for ${selectedCity}.`);
      } finally {
        // Only turn off loading if the controller is still valid to avoid layout jumps
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchForecast();

    // Clean up function: Cancels the pending request if the user switches cities or closes the page
    return () => {
      abortController.abort();
    };
  }, [selectedCity]);

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
  };

  return (
    <div className="w-full p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100">AI Predictive Demand Analysis</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time database records and metric distribution trends</p>
        </div>
        
        <select 
          value={selectedCity} 
          onChange={handleCityChange}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm p-2 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[140px] cursor-pointer"
        >
          {CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Conditional Layout Rendering */}
      {loading ? (
        <div className="h-[300px] w-full flex items-center justify-center text-slate-400 font-medium animate-pulse bg-slate-800/30 rounded-lg">
          Analyzing metrics and generating distribution...
        </div>
      ) : error ? (
        <div className="h-[300px] w-full flex flex-col items-center justify-center text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <p className="font-semibold">{error}</p>
          <p className="text-xs text-slate-500 mt-1">Verify that your backend forecasting data layer is populated.</p>
        </div>
      ) : forecastData.length === 0 ? (
        <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg p-6">
          <p className="font-medium">No real metrics recorded for {selectedCity} yet.</p>
          <p className="text-xs text-slate-600 mt-1 text-center max-w-sm">
            Interact with the dashboard or execute data generation routines to populate historical arrays.
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="displayTime" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {/* Line 1: Real Recorded Database Volume Metrics */}
              <Line 
                name="Actual Order Load"
                type="monotone" 
                dataKey="actual_demand" // Make sure this key matches your Python Pydantic Schema model
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }} 
              />

              {/* Line 2: AI Generated Predictive Benchmarks */}
              <Line 
                name="Predicted AI Trend"
                type="monotone" 
                dataKey="predicted_demand" // Make sure this key matches your Python Pydantic Schema model
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DemandChart;