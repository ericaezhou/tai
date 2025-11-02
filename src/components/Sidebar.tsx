"use client";

import { useState } from "react";

interface Assignment {
  id: string;
  name: string;
  active?: boolean;
}

interface SidebarProps {
  courseName: string;
  assignments: Assignment[];
  onAssignmentClick?: (assignmentId: string) => void;
}

export default function Sidebar({ courseName, assignments, onAssignmentClick }: SidebarProps) {
  const [activeAssignment, setActiveAssignment] = useState(assignments[0]?.id);

  const handleAssignmentClick = (assignmentId: string) => {
    setActiveAssignment(assignmentId);
    onAssignmentClick?.(assignmentId);
  };

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-gray-300">
      {/* TAI Branding */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-blue-600">TAI</h1>
      </div>

      {/* Course Name */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Course
        </h2>
        <p className="text-lg font-medium text-gray-900">{courseName}</p>
      </div>

      {/* Assignments List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Assignments
          </h3>
          <nav className="space-y-1">
            {assignments.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => handleAssignmentClick(assignment.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeAssignment === assignment.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {assignment.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
