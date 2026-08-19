import {
  getApplications,
  getRequirements,
  getTemplates,
} from "@/app/actions/requirements";
import { getDocuments } from "@/app/actions/documents";
import { RequirementsView } from "@/components/requirements/requirements-view";

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const appIdParam = typeof params.appId === "string" ? params.appId : null;

  const [applications, templates, documents] = await Promise.all([
    getApplications(),
    getTemplates(),
    getDocuments(),
  ]);

  // Default to the first application if none is selected
  const activeAppId = appIdParam || (applications[0]?.id ?? null);

  const requirements = activeAppId ? await getRequirements(activeAppId) : [];

  return (
    <div className="flex w-full flex-col gap-8">
      <RequirementsView
        applications={applications}
        activeAppId={activeAppId}
        requirements={requirements}
        templates={templates}
        documents={documents}
      />
    </div>
  );
}

