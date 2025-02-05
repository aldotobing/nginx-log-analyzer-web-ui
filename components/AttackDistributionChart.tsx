import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface AttackDistributionChartProps {
  data: { [key: string]: number };
}

export function AttackDistributionChart({
  data,
}: AttackDistributionChartProps) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Attack Distribution",
        data: Object.values(data),
        backgroundColor: "rgba(255, 99, 132, 0.2)", // Red with low opacity
        borderColor: "rgba(255, 99, 132, 1)", // Red
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#4B5563", // Dark gray for legend
          font: {
            size: 14,
          },
        },
      },
      // title: {
      //   display: true,
      //   text: "Attack Distribution",
      //   font: {
      //     size: 20,
      //     weight: "bold" as const,
      //   },
      //   color: "#1F2937", // Dark text for readability
      //   padding: {
      //     top: 10,
      //     bottom: 20,
      //   },
      // },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: "#E5E7EB", // Light grid color for better visibility
        },
        ticks: {
          color: "#6B7280", // Darker tick color for readability
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-red-100 via-white to-red-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Visualizing Attack Distribution
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
          A breakdown of attack distribution in your system's traffic.
        </p>
      </div>
      <Radar data={chartData} options={options} />
    </div>
  );
}
