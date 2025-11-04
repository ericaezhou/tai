'use client'

import { useState, useEffect } from 'react';
import { Rubric, RubricCriteria } from '@/types';
import { getRubricBySolution } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface RubricDisplayProps {
  solutionId: string;
}

export function RubricDisplay({ solutionId }: RubricDisplayProps) {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRubric() {
      try {
        setLoading(true);
        const result = await getRubricBySolution(solutionId);
        
        if (result.success && result.rubric) {
          setRubric(result.rubric);
        } else {
          setError(result.error || 'Unknown error occurred');
        }
      } catch (err) {
        setError('Failed to fetch rubric');
      } finally {
        setLoading(false);
      }
    }

    fetchRubric();
  }, [solutionId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading rubric...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rubric) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <p>No rubric found for this solution.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{rubric.title}</CardTitle>
          <CardDescription>{rubric.description}</CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Total Points: {rubric.totalPoints}</Badge>
            <Badge variant="outline">
              Generated: {new Date(rubric.generatedAt).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {rubric.criteria.map((criterion) => (
          <RubricCriterionCard key={criterion.id} criterion={criterion} />
        ))}
      </div>
    </div>
  );
}

interface RubricCriterionCardProps {
  criterion: RubricCriteria;
}

function RubricCriterionCard({ criterion }: RubricCriterionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{criterion.name}</CardTitle>
          <Badge variant="secondary">{criterion.maxPoints} points</Badge>
        </div>
        <CardDescription>{criterion.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {criterion.levels.map((level) => (
            <div
              key={level.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{level.name}</span>
                  <Badge variant="outline">{level.points} pts</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
