import { PipelineBoard } from "@/components/deal-scout/pipeline-board";

export const metadata = { title: "Pipeline · DealScout" };

export default function PipelinePage() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <PipelineBoard />
    </div>
  );
}
