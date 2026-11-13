"use client";

import { useMemo, useState } from "react";
import { useProcedureLibrary } from "@/shared/construction-procedures/hooks/useProcedureLibrary";
import type { ProcedureLibraryItem } from "@/shared/construction-procedures/utils/procedure-library";
import type { ProjectFormData } from "@/shared/projects_works/types/project.types";
import {
  createInitialForm,
  toProjectFormData,
  validateCreateForm,
  type CreateProjectForm,
} from "../utils/create-project-form";
import { procedureTarget } from "../utils/procedure-target";

export function useCreateProjectForm(onSubmit: (data: ProjectFormData) => void) {
  const { procedures } = useProcedureLibrary();
  const library = useMemo(() => procedures.filter((p) => p.enabled), [procedures]);
  const [initial] = useState(() => createInitialForm());
  const [form, setForm] = useState<CreateProjectForm>(initial);
  const [errorMsg, setErrorMsg] = useState("");

  const update = (patch: Partial<CreateProjectForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrorMsg("");
  };

  const toggleProcedure = (procedure: ProcedureLibraryItem, checked: boolean) => {
    const rest = Object.fromEntries(Object.entries(form.procedures).filter(([, id]) => id !== procedure.id));
    update({ procedures: checked ? { ...rest, [procedureTarget(procedure, rest)]: procedure.id } : rest });
  };

  const submit = () => {
    const error = validateCreateForm(form);
    if (error) {
      setErrorMsg(error);
      return;
    }
    onSubmit(toProjectFormData(form));
  };

  return {
    form,
    update,
    library,
    toggleProcedure,
    submit,
    errorMsg,
    isDirty: JSON.stringify(form) !== JSON.stringify(initial),
  };
}
