"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockAssignmentData } from "@/lib/mockData";
import { sharedAssignments } from "@/lib/assignments";
import Sidebar from "@/components/Sidebar";
import DistributionGraph from "@/components/DistributionGraph";
import InsightsPanel from "@/components/InsightsPanel";
import SubmissionsTable from "@/components/SubmissionsTable";

interface AssignmentPageProps {
  params: {
    assignmentId: string;
  };
}

export default function AssignmentPage({ params }: AssignmentPageProps) {
  const { assignmentId } = params;
  const router = useRouter();
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const { title, questions, submissions, overallInsights, questionInsights } =
    mockAssignmentData;

  const currentInsights = selectedQuestion
    ? questionInsights.find((qi) => qi.questionId === selectedQuestion)?.insights ||
      overallInsights
    : overallInsights;

  const handleStudentClick = (submissionId: string) => {
    router.push(`/assignment/${assignmentId}/submission/${submissionId}`);
  };

  // Get question display names (Q1, Q2, Q3, Q4)
  const getQuestionDisplayName = (questionId: string) => {
    const index = questions.findIndex((q) => q.id === questionId);
    return `Q${index + 1}`;
  };

  // Get assignment name based on ID
  const assignmentName = sharedAssignments.find((a) => a.id === assignmentId)?.name || "Assignment";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar
        courseName="CS 101: Data Structures"
        assignments={sharedAssignments}
        currentAssignmentId={assignmentId}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {/* Assignment Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{assignmentName}</h1>
            <p className="text-sm text-gray-600 mt-1">{submissions.length} total submissions</p>
          </div>

          {/* Summary and Graph Section - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - Summary */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
                <div className="relative">
                  <select
                    id="question-select"
                    value={selectedQuestion || ""}
                    onChange={(e) => setSelectedQuestion(e.target.value || null)}
                    className="w-full px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 hover:border-gray-300 transition-colors cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">Overall Performance</option>
                    {questions.map((question) => (
                      <option key={question.id} value={question.id}>
                        {getQuestionDisplayName(question.id)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* AI-generated summary as plain text */}
              <InsightsPanel insights={currentInsights} />
            </div>

            {/* Right Column - Distribution Graph */}
            <div className="lg:col-span-2">
              <DistributionGraph
                submissions={submissions}
                selectedQuestion={selectedQuestion}
                questions={questions}
              />
            </div>
          </div>

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
