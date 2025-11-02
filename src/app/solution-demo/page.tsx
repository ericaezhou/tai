import { SolutionUpload } from '@/components/solution-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SolutionDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Solution Upload & Rubric Generation Demo</h1>
          <p className="text-lg text-gray-600">
            Upload your assignment solution and get an AI-generated rubric instantly
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>
              This demo showcases the complete workflow for solution processing and rubric generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Process Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Upload your solution file (code, document, etc.)</li>
                  <li>Solution is saved to the database</li>
                  <li>AI analyzes the solution content and file type</li>
                  <li>Customized rubric is generated based on the analysis</li>
                  <li>Rubric is saved and displayed for review</li>
                </ol>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Supported File Types:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Code:</strong> .js, .ts, .py, .java, .cpp, .c, .cs</p>
                  <p><strong>Documents:</strong> .pdf, .doc, .docx, .txt, .md</p>
                  <p><strong>Rubric Types:</strong> Automatically adapts based on file type</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SolutionUpload 
          assignmentId="demo-assignment-1" 
          assignmentName="Demo Assignment - Algorithm Implementation"
        />
      </div>
    </div>
  );
}
