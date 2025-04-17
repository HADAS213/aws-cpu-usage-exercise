// App.js
import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';


ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PERIOD_OPTIONS = {
  'Last hour': 60,
  'Last day': 1440,
  'Last week': 10080,
};

function App() {
  const [ip, setIp] = useState('172.31.88.161');
  const [timePeriodLabel, setTimePeriodLabel] = useState('Last day');
  const [intervalSec, setIntervalSec] = useState(300);
  const [cpuData, setCpuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCpuData(null);

    const timePeriod = PERIOD_OPTIONS[timePeriodLabel];

    try {
      const res = await axios.get('http://localhost:5000/cpu-usage', {
        params: { ip, timePeriod, interval: intervalSec }
      });
      console.log('Response:', res.data);
      setCpuData(res.data);
    } catch (err) {
      setError('Failed to fetch CPU data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = cpuData && {
    datasets: [{
      label: 'Metric Data',
      data: cpuData.timestamps.map((ts, i) => ({
        x: new Date(ts),
        y: cpuData.usageData[i]
      })),
      fill: true,
      tension: 0.4,
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
    }]
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',            
        time: {
          unit: 'hour',            
          displayFormats: {
            hour: 'hh a',       
          }
        },
        title: {
          display: true,
          text: 'Time'
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Percentage'
        }
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AWS Instance CPU Usage</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>
          Time Period:
          <select
            value={timePeriodLabel}
            onChange={e => setTimePeriodLabel(e.target.value)}
            style={{ marginLeft: 5, padding: 4 }}
          >
            {Object.keys(PERIOD_OPTIONS).map(label => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </label>

        <label style={{ marginRight: 10 }}>
          Period:
          <input
            type="number"
            value={intervalSec}
            onChange={e => setIntervalSec(Number(e.target.value))}
            style={{ marginLeft: 5, padding: 4, width: '5rem' }}
          />
        </label>

        <label style={{ marginRight: 10 }}>
          IP Adress:
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            style={{
              marginLeft: 5,
              padding: 4,
              border: '1px solid #ccc',
              borderRadius: 4,
              width: '10rem'
            }}
          />
        </label>

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Load Data
        </button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {cpuData && <Line data={chartData} options={options} />}
    </div>
  );
}

export default App;
