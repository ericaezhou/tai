"use client";

import { StudentSubmission, Question } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DistributionGraphProps {
  submissions: StudentSubmission[];
  selectedQuestion: string | null;
  questions: Question[];
}

export default function DistributionGraph({
  submissions,
  selectedQuestion,
  questions
}: DistributionGraphProps) {
  // Calculate distribution data
  const getDistributionData = () => {
    const ranges = [
      { range: "0-59", min: 0, max: 59, count: 0, color: "#ef4444" },
      { range: "60-69", min: 60, max: 69, count: 0, color: "#f97316" },
      { range: "70-79", min: 70, max: 79, count: 0, color: "#eab308" },
      { range: "80-89", min: 80, max: 89, count: 0, color: "#84cc16" },
      { range: "90-100", min: 90, max: 100, count: 0, color: "#22c55e" },
    ];

    submissions.forEach((submission) => {
      let percentage: number;

      if (selectedQuestion) {
        const questionScore = submission.questionScores.find(
          (qs) => qs.questionId === selectedQuestion
        );
        if (!questionScore) return;

        const question = questions.find(q => q.id === selectedQuestion);
        if (!question) return;

        percentage = (questionScore.score / question.maxScore) * 100;
      } else {
        percentage = (submission.totalScore / submission.maxScore) * 100;
      }

      const range = ranges.find(
        (r) => percentage >= r.min && percentage <= r.max
      );
      if (range) range.count++;
    });

    return ranges;
  };

  const data = getDistributionData();
  const maxCount = Math.max(...data.map(d => d.count));

  // Calculate statistics
  const calculateStats = () => {
    let scores: number[];

    if (selectedQuestion) {
      const question = questions.find(q => q.id === selectedQuestion);
      if (!question) return { average: 0, median: 0, stdDev: 0 };

      scores = submissions
        .map(sub => {
          const qs = sub.questionScores.find(q => q.questionId === selectedQuestion);
          return qs ? (qs.score / question.maxScore) * 100 : 0;
        })
        .filter(score => score > 0);
    } else {
      scores = submissions.map(sub => (sub.totalScore / sub.maxScore) * 100);
    }

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return { average, median, stdDev };
  };

  const stats = calculateStats();
  const selectedQuestionTitle = selectedQuestion
    ? questions.find(q => q.id === selectedQuestion)?.title
    : "Overall Performance";

  return (
    <div className="mt-4">
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              label={{ value: 'Score Range (%)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
              domain={[0, maxCount + 1]}
            />
            <Tooltip
              formatter={(value) => [`${value} students`, 'Count']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Average</p>
          <p className="text-2xl font-bold text-gray-800">{stats.average.toFixed(1)}%</p>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Median</p>
          <p className="text-2xl font-bold text-gray-800">{stats.median.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Std. Dev</p>
          <p className="text-2xl font-bold text-gray-800">{stats.stdDev.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
