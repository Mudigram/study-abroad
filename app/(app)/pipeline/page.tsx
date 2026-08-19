import { getApplications } from "@/app/actions/applications";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { AddApplicationDialog } from "@/components/pipeline/add-application-dialog";

export default async function PipelinePage() {
  const applications = await getApplications();

  return (
    <div className="flex w-full flex-col gap-6 h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-sans">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track program options from initial ideas to final decision stages.
          </p>
        </div>
        <AddApplicationDialog />
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <KanbanBoard initialApplications={applications} />
      </div>
    </div>
  );
}
