"use client";

import { QuestionInsights } from "@/types";

interface InsightsPanelProps {
  insights: string;
  questionInsights?: QuestionInsights;
}

export default function InsightsPanel({ insights, questionInsights }: InsightsPanelProps) {
  return (
    <div className="text-gray-600 text-sm leading-relaxed">
      {insights}
    </div>
  );
}
