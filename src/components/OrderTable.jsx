import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/api';

const STATUS_STYLES = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  ACCEPTED: 'bg-sky-500/20 text-sky-400',
  ARRIVED_AT_PICKUP: 'bg-violet-500/20 text-violet-300',
  CARGO_LOADED: 'bg-blue-500/20 text-blue-400',
  IN_TRANSIT: 'bg-blue-500/20 text-blue-400',
  DELIVERED: 'bg-emerald-500/20 text-emerald-400',
};

const formatStatus = (status) => status?.replace(/_/g, ' ') || 'UNKNOWN';

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Use a ref to track loading state across effect executions safely
  const isInitialLoad = useRef(true);

  // Memoize fetchOrders with useCallback so it doesn't break dependencies
  const fetchOrders = useCallback(async () => {
    // Production Safety: Do not make network requests if the user isn't looking at the page
    if (document.hidden) return;

    try {
      const response = await apiFetch('/orders/active');
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (error) {
      console.error("Failed to fetch active orders:", error);
      setError('Unable to load active dispatches.');
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    // 1. Fire immediately on component mount
    fetchOrders();

    // 2. Set a production-friendly 15-second heartbeat loop
    const POLLING_INTERVAL_MS = 15000;
    const intervalId = setInterval(fetchOrders, POLLING_INTERVAL_MS);

    // 3. Auto-sync the exact moment the user switches back into this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Bulletproof cleanup to prevent concurrent running timers or leaks
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders]);

  if (loading) {
    return <div className="text-slate-400 p-4 animate-pulse">Loading manifest data...</div>;
  }

  if (error && orders.length === 0) {
    return (
      <div className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 border-2 border-dashed border-slate-700 rounded-lg">
        <p>No active dispatches.</p>
        <p className="text-xs mt-1">Use the Dispatch Command to assign a route.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
          <tr>
            <th scope="col" className="px-4 py-3">Order ID</th>
            <th scope="col" className="px-4 py-3">Destination</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">AI ETA</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id || order.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-blue-400">{order.id}</td>
              <td className="px-4 py-3 truncate max-w-[150px]">{order.destination}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_STYLES[order.status] || 'bg-slate-700 text-slate-300'}`}>
                  {formatStatus(order.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400 font-mono">{order.eta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;