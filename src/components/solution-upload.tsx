'use client'

import { useState } from 'react';
import { uploadAndProcessSolution } from '@/app/actions';
import { Solution, Rubric } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RubricDisplay } from './rubric-display';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface SolutionUploadProps {
  assignmentId: string;
  assignmentName?: string;
}

export function SolutionUpload({ assignmentId, assignmentName }: SolutionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    solution?: Solution;
    rubric?: Rubric;
    error?: string;
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null); // Reset previous results
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadAndProcessSolution(file, assignmentId);
      // setUploadResult(result);
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    // Reset file input
    const fileInput = document.getElementById('solution-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Solution</CardTitle>
          <CardDescription>
            {assignmentName ? `Upload your solution for ${assignmentName}` : 'Upload your assignment solution'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadResult?.success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="solution-file">Select Solution File</Label>
                <Input
                  id="solution-file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".js,.ts,.py,.java,.cpp,.c,.cs,.pdf,.doc,.docx,.txt,.md"
                  disabled={uploading}
                />
                {file && (
                  <p className="text-sm text-gray-600">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Solution...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Generate Rubric
                  </>
                )}
              </Button>
            </>
          )}

          {uploadResult && (
            <div className="space-y-4">
              {uploadResult.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Solution uploaded and rubric generated successfully!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>Error: {uploadResult.error}</span>
                </div>
              )}

              {uploadResult.success && uploadResult.solution && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Solution Details</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>File:</strong> {uploadResult.solution.fileName}</p>
                    <p><strong>Uploaded:</strong> {new Date(uploadResult.solution.uploadedAt).toLocaleString()}</p>
                    <p><strong>Solution ID:</strong> {uploadResult.solution.id}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={resetUpload}
                variant="outline"
                className="w-full"
              >
                Upload Another Solution
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadResult?.success && uploadResult.solution && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Generated Rubric</h3>
          <RubricDisplay solutionId={uploadResult.solution.id} />
        </div>
      )}
    </div>
  );
}
