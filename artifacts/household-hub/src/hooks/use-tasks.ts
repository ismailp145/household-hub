import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateTask, 
  useUpdateTask,
  getGetHouseholdDashboardQueryKey,
  getGetProjectQueryKey
} from "@workspace/api-client-react";

export function useTasks(householdId: string, projectId?: string) {
  const queryClient = useQueryClient();

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHouseholdDashboardQueryKey(householdId) });
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(householdId, projectId) });
        }
      }
    }
  });

  const updateMutation = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHouseholdDashboardQueryKey(householdId) });
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(householdId, projectId) });
        }
      }
    }
  });

  return {
    createTask: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTask: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
