// hooks/useDrainData.ts
import { useState, useEffect } from 'react';
import { drainService } from '@/api';
import { Drain } from '@/types/drain.types';

export const useDrainData = (searchQuery: string) => {
  const [apiDrains, setApiDrains] = useState<Drain[]>([]);
  const [filteredDrains, setFilteredDrains] = useState<Drain[]>([]);
  const [isLoadingDrains, setIsLoadingDrains] = useState(true);

  // Fetch drains
  useEffect(() => {
    (async () => {
      try {
        const drains = await drainService.getAllDrains();
        setApiDrains(Array.isArray(drains) ? drains : []);
        setFilteredDrains(Array.isArray(drains) ? drains : []);
      } catch (e) {
        console.error("Failed to fetch drains:", e);
        setApiDrains([]);
        setFilteredDrains([]);
      } finally {
        setIsLoadingDrains(false);
      }
    })();
  }, []);

  // Filter drains by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDrains(apiDrains);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = apiDrains.filter(
      (drain) =>
        drain.drainId.toString().includes(query) ||
        drain.name?.toLowerCase().includes(query) ||
        drain.basinId.toLowerCase().includes(query) ||
        drain.zoneId.toLowerCase().includes(query),
    );
    setFilteredDrains(filtered);
  }, [searchQuery, apiDrains]);

  return {
    apiDrains,
    filteredDrains,
    isLoadingDrains,
  };
};
