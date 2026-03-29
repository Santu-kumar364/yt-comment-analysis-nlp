// SentimentChart.js
import React from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

function SentimentChart({ comments }) {
  const positive = comments.filter(c => c.sentiment === "POSITIVE").length;
  const negative = comments.filter(c => c.sentiment === "NEGATIVE").length;
  const neutral = comments.filter(c => c.sentiment === "NEUTRAL").length;

  const data = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        label: "Sentiment Analysis",
        data: [positive, neutral, negative],
        backgroundColor: ["#22c55e", "#facc15", "#ef4444"], // green, yellow, red
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-md mx-auto my-5">
      <Pie data={data} />
    </div>
  );
}

export default SentimentChart;