import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateProject, 
  getGetHouseholdDashboardQueryKey,
  useGetProject
} from "@workspace/api-client-react";

export function useProjects(householdId: string) {
  const queryClient = useQueryClient();

  const createMutation = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHouseholdDashboardQueryKey(householdId) });
      }
    }
  });

  return {
    createProject: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useProjectDetail(householdId: string, projectId: string) {
  return useGetProject(householdId, projectId);
}
