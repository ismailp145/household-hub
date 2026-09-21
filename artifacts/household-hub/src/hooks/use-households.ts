import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateHousehold, 
  useJoinHousehold, 
  useListHouseholds, 
  getListHouseholdsQueryKey,
  getGetHouseholdDashboardQueryKey
} from "@workspace/api-client-react";

export function useHouseholds() {
  const queryClient = useQueryClient();
  const listQuery = useListHouseholds();

  const createMutation = useCreateHousehold({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHouseholdsQueryKey() });
      }
    }
  });

  const joinMutation = useJoinHousehold({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListHouseholdsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetHouseholdDashboardQueryKey(data.id) });
      }
    }
  });

  return {
    households: listQuery.data || [],
    isLoading: listQuery.isLoading,
    createHousehold: createMutation.mutate,
    isCreating: createMutation.isPending,
    joinHousehold: joinMutation.mutate,
    isJoining: joinMutation.isPending,
  };
}
