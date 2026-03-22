"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale,
  BarElement,
  BarController,
  ChartOptions,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { enUS } from "date-fns/locale";
import { OHLCV } from "@/types";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";

// Register ChartJS components including Financial chart elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale,
  CandlestickController,
  CandlestickElement,
);

interface StockChartProps {
  data: OHLCV[];
  timeframe?: string;
}

export function StockCandlestickChart({
  data,
  timeframe = "ALL",
}: StockChartProps) {
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data chronologically
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (timeframe === "ALL") return sorted;

    // Filter based on timeframe relative to the latest data point
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const endTime = lastDate.getTime();
    let startTime = endTime;

    switch (timeframe) {
      case "30M":
        startTime = endTime - 30 * 60 * 1000;
        break;
      case "1H":
        startTime = endTime - 60 * 60 * 1000;
        break;
      case "2H":
        startTime = endTime - 120 * 60 * 1000;
        break;
      default:
        startTime = 0; // Show all
    }

    return sorted.filter((d) => new Date(d.date).getTime() >= startTime);
  }, [data, timeframe]);

  const chartData = useMemo(() => {
    if (chartType === "line") {
      return {
        datasets: [
          {
            type: "line" as const,
            label: "Price",
            data: filteredData.map((d) => ({
              x: new Date(d.date),
              y: d.close,
            })),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            tension: 0.1,
            pointRadius: 0,
            borderWidth: 2,
            pointHoverRadius: 4,
          },
        ],
      };
    } else {
      return {
        datasets: [
          {
            type: "candlestick" as const,
            label: "OHLC",
            data: filteredData.map((d) => ({
              x: new Date(d.date).valueOf(), // adapter-date-fns handles valueOf or Date object
              o: d.open,
              h: d.high,
              l: d.low,
              c: d.close,
            })),
            color: {
              up: "rgba(0, 200, 0, 1)",
              down: "rgba(200, 0, 0, 1)",
              unchanged: "rgba(100, 100, 100, 1)",
            },
            borderColor: {
              up: "rgba(0, 200, 0, 1)",
              down: "rgba(200, 0, 0, 1)",
              unchanged: "rgba(100, 100, 100, 1)",
            },
          },
        ],
      };
    }
  }, [filteredData, chartType]);

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          // Force minute level granularity for short timeframes, auto for others
          unit:
            timeframe === "30M" || timeframe === "1H" || timeframe === "2H"
              ? "minute"
              : undefined,
          displayFormats: {
            minute: "HH:mm",
            hour: "dd MMM HH:mm",
            day: "dd MMM",
          },
          tooltipFormat: "dd MMM yyyy HH:mm",
        },
        adapters: {
          date: {
            locale: enUS,
          },
        },
        grid: {
          display: false,
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
      axis: "x",
    },
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900/50 rounded-xl p-4 backdrop-blur-sm border border-white/10 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white/90 text-sm font-semibold tracking-wide">
          Market Overview
        </h3>
        <button
          onClick={() =>
            setChartType((prev) => (prev === "line" ? "candlestick" : "line"))
          }
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 font-medium"
        >
          {chartType === "line" ? "Switch to Candles" : "Switch to Line"}
        </button>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Chart
          type={chartType === "line" ? "line" : "candlestick"}
          data={chartData}
          options={options}
        />
      </div>
    </div>
  );
}
