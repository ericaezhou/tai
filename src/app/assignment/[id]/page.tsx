"use client";

import { useState, use } from "react";
import { mockAssignmentData } from "@/lib/mockData";
import { sharedAssignments } from "@/lib/assignments";
import Sidebar from "@/components/Sidebar";
import DistributionGraph from "@/components/DistributionGraph";
import InsightsPanel from "@/components/InsightsPanel";
import SubmissionsTable from "@/components/SubmissionsTable";

interface AssignmentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = use(params);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const { title, questions, submissions, overallInsights, questionInsights } =
    mockAssignmentData;

  const currentInsights = selectedQuestion
    ? questionInsights.find((qi) => qi.questionId === selectedQuestion)?.insights ||
      overallInsights
    : overallInsights;

  const handleStudentClick = (submissionId: string) => {
    console.log("View student submission:", submissionId);
    // TODO: Navigate to detailed submission view
  };

  // Get question display names (Q1, Q2, Q3, Q4)
  const getQuestionDisplayName = (questionId: string) => {
    const index = questions.findIndex((q) => q.id === questionId);
    return `Q${index + 1}`;
  };

  // Get assignment name based on ID
  const assignmentName = sharedAssignments.find((a) => a.id === id)?.name || "Assignment";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar
        courseName="CS 101: Data Structures"
        assignments={sharedAssignments}
        currentAssignmentId={id}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {/* Assignment Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{assignmentName}</h1>
            <p className="text-sm text-gray-600 mt-1">{submissions.length} total submissions</p>
          </div>

          {/* Summary Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
              <select
                id="question-select"
                value={selectedQuestion || ""}
                onChange={(e) => setSelectedQuestion(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Overall</option>
                {questions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {getQuestionDisplayName(question.id)}
                  </option>
                ))}
              </select>
            </div>

            {/* AI-generated summary as plain text */}
            <InsightsPanel insights={currentInsights} />
          </div>

          {/* Distribution Graph */}
          <DistributionGraph
            submissions={submissions}
            selectedQuestion={selectedQuestion}
            questions={questions}
          />

          {/* Horizontal Divider */}
          <div className="my-8 border-t border-gray-300"></div>

          {/* Student Performance Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Student Performance
            </h2>
            <SubmissionsTable
              submissions={submissions}
              onStudentClick={handleStudentClick}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
