"use client";

import { StudentSubmission } from "@/types";

interface SubmissionsTableProps {
  submissions: StudentSubmission[];
  onStudentClick?: (submissionId: string) => void;
}

export default function SubmissionsTable({
  submissions,
  onStudentClick
}: SubmissionsTableProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 bg-green-50";
    if (percentage >= 80) return "text-lime-600 bg-lime-50";
    if (percentage >= 70) return "text-yellow-600 bg-yellow-50";
    if (percentage >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  // Sort submissions by total score descending
  const sortedSubmissions = [...submissions].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-t border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              First Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedSubmissions.map((submission) => {
            const percentage = (submission.totalScore / submission.maxScore) * 100;
            const nameParts = submission.studentName.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            return (
              <tr
                key={submission.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onStudentClick?.(submission.id)}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {firstName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {lastName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {submission.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                      percentage
                    )}`}
                  >
                    {submission.totalScore} / {submission.maxScore}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
