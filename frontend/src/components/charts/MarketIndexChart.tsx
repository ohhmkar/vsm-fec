"use client";

import { useState, useMemo } from "react";
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

interface MarketChartProps {
  data: OHLCV[];
  timeframe?: string;
}

export function MarketIndexChart({
  data,
  timeframe = "ALL",
}: MarketChartProps) {
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
            label: "Index Value",
            data: filteredData.map((d) => ({
              x: new Date(d.date),
              y: d.close,
            })),
            borderColor: "rgb(255, 206, 86)", // Gold color
            backgroundColor: "rgba(255, 206, 86, 0.5)",
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
    <div className="w-full h-full flex flex-col relative group pb-4">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() =>
            setChartType((prev) => (prev === "line" ? "candlestick" : "line"))
          }
          className="text-xs px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--accent-blue)] hover:text-white text-[var(--text-secondary)] transition-colors border border-[var(--border-color)] shadow-sm font-medium z-50 pointer-events-auto"
        >
          {chartType === "line" ? "Switch to Candles" : "Switch to Line"}
        </button>
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        <Chart
          type={chartType === "line" ? "line" : "candlestick"}
          data={chartData}
          options={options}
        />
      </div>
    </div>
  );
}
