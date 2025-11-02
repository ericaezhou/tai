"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, FileText } from "lucide-react"
import type { Assignment } from "@/app/page"

type AssignmentsOverviewProps = {
  assignments: Assignment[]
  onCreateNew: () => void
}

export function AssignmentsOverview({ assignments, onCreateNew }: AssignmentsOverviewProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">TA Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage assignments and track student performance</p>
        </div>
        <Button onClick={onCreateNew} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Create Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>View and manage all course assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No assignments yet</p>
              <Button onClick={onCreateNew} variant="outline">
                Create your first assignment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Name</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/assignment/${assignment.id}`} className="block">
                        {assignment.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/assignment/${assignment.id}`} className="block">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/assignment/${assignment.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
