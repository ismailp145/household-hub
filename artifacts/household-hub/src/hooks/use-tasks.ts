import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateTask, 
  useUpdateTask,
  useDeleteTask,
  getGetHouseholdDashboardQueryKey,
  getGetProjectQueryKey,
  getListHouseholdsQueryKey
} from "@workspace/api-client-react";

export function useTasks(householdId: string, projectId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetHouseholdDashboardQueryKey(householdId) });
    queryClient.invalidateQueries({ queryKey: getListHouseholdsQueryKey() });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(householdId, projectId) });
    }
  };

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: invalidate
    }
  });

  const updateMutation = useUpdateTask({
    mutation: {
      onSuccess: invalidate
    }
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: invalidate
    }
  });

  return {
    createTask: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTask: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTask: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
