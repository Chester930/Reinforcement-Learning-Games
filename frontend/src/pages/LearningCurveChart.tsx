import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LearningCurveChartProps {
  rewards: number[];
  steps: number[];
}

const LearningCurveChart: React.FC<LearningCurveChartProps> = ({ rewards, steps }) => {
  const data = {
    labels: rewards.map((_, i) => `回合 ${i + 1}`),
    datasets: [
      {
        label: '每回合獎勵',
        data: rewards,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
        tension: 0.1,
        fill: true,
      },
      {
        label: '每回合步數',
        data: steps,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: '學習曲線 (獎勵 vs 步數)',
        font: { size: 18 },
      },
      tooltip: {
        boxPadding: 4,
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '獎勵值',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '步數',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ height: 350, width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default LearningCurveChart; 