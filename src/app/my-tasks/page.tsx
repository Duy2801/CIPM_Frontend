import { MyTasksScreen } from "@/features/my-tasks";

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <MyTasksScreen projectId={firstValue(params.projectId)} stepId={firstValue(params.stepId)} />;
}
