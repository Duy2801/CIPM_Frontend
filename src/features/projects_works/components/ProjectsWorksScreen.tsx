"use client";

import { useProjectsWorks } from "../hooks/useProjectsWorks";
import CreateProjectPage from "./create/CreateProjectPage";
import ProjectDetailPage from "./detail/ProjectDetailPage";
import ProjectsFilterToolbar from "./list/ProjectsFilterToolbar";
import ProjectsTable from "./list/ProjectsTable";
import ProjectActionConfirmModal from "./shared/ProjectActionConfirmModal";

export default function ProjectsWorksScreen() {
  const ctl = useProjectsWorks();

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-2.5 select-none">
      {ctl.isCreateOpen ? (
        <CreateProjectPage nextAutoCode={ctl.nextAutoCode} onBack={ctl.closeCreate} onCreateProject={ctl.createProject} />
      ) : ctl.detailProjectId ? (
        <ProjectDetailPage key={ctl.detailProjectId} projectId={ctl.detailProjectId} onBack={ctl.closeDetail} />
      ) : (
        <>
          <ProjectsFilterToolbar
            searchTerm={ctl.searchTerm}
            onSearchChange={ctl.setSearchTerm}
            selectedType={ctl.selectedType}
            onTypeChange={ctl.setSelectedType}
            statusFilter={ctl.statusFilter}
            onStatusFilterChange={ctl.setStatusFilter}
            canCreateProject={ctl.canCreateProject}
            onOpenCreateModal={ctl.openCreate}
          />
          <ProjectsTable
            projects={ctl.paginatedProjects}
            currentPage={ctl.currentPage}
            pageSize={ctl.pageSize}
            total={ctl.filteredProjects.length}
            sortBy={ctl.sortBy}
            onSortChange={ctl.setSortBy}
            onPageChange={ctl.setCurrentPage}
            onViewDetail={ctl.openDetail}
            onCloseProject={ctl.requestToggleProject}
          />
        </>
      )}

      <ProjectActionConfirmModal
        open={ctl.confirmAction.open}
        type={ctl.confirmAction.type}
        project={ctl.confirmAction.project}
        onClose={ctl.cancelProjectAction}
        onConfirm={ctl.confirmProjectAction}
      />
    </div>
  );
}
