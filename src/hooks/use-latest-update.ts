import { useQuery } from '@tanstack/react-query';
import { AppUpdateService } from '@/api/services/update-service';

export const useLatestUpdate = () => {
    return useQuery({
        queryKey: ['latest_app_update'],
        queryFn: AppUpdateService.getLatestUpdate,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
};
