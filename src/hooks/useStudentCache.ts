import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';

const STUDENTS_CACHE_KEY = 'offline_students_cache';
const CACHE_TIMESTAMP_KEY = 'offline_students_cache_timestamp';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface CachedStudents {
  students: Student[];
  timestamp: number;
}

export const useStudentCache = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load cache timestamp on mount
  useEffect(() => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (timestamp) {
      setLastSync(new Date(parseInt(timestamp)));
    }
  }, []);

  // Get cached students from localStorage
  const getCachedStudents = useCallback((): Student[] => {
    try {
      const cached = localStorage.getItem(STUDENTS_CACHE_KEY);
      if (cached) {
        const parsed: CachedStudents = JSON.parse(cached);
        return parsed.students || [];
      }
    } catch (e) {
      console.error('Failed to parse cached students:', e);
    }
    return [];
  }, []);

  // Find student by unique ID from cache
  const findStudentByUniqueId = useCallback((uniqueId: string): Student | null => {
    const students = getCachedStudents();
    return students.find(s => s.student_unique_id === uniqueId) || null;
  }, [getCachedStudents]);

  // Save students to cache
  const saveToCache = useCallback((students: Student[]) => {
    try {
      const cacheData: CachedStudents = {
        students,
        timestamp: Date.now(),
      };
      localStorage.setItem(STUDENTS_CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      setLastSync(new Date());
    } catch (e) {
      console.error('Failed to save students to cache:', e);
    }
  }, []);

  // Sync students from server to cache
  const syncStudentsToCache = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      console.log('Cannot sync students cache - device is offline');
      return false;
    }

    setIsLoading(true);
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Failed to fetch students for cache:', error);
        return false;
      }

      saveToCache(students || []);
      console.log(`Synced ${students?.length || 0} students to offline cache`);
      return true;
    } catch (e) {
      console.error('Error syncing students to cache:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveToCache]);

  // Check if cache needs refresh
  const isCacheStale = useCallback((): boolean => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge > CACHE_MAX_AGE;
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const students = getCachedStudents();
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    return {
      count: students.length,
      lastSync: timestamp ? new Date(parseInt(timestamp)) : null,
      isStale: isCacheStale(),
    };
  }, [getCachedStudents, isCacheStale]);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(STUDENTS_CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    setLastSync(null);
  }, []);

  // Auto-sync on mount if online and cache is stale
  useEffect(() => {
    if (navigator.onLine && isCacheStale()) {
      syncStudentsToCache();
    }
  }, [isCacheStale, syncStudentsToCache]);

  // Listen for online event to sync
  useEffect(() => {
    const handleOnline = () => {
      if (isCacheStale()) {
        syncStudentsToCache();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isCacheStale, syncStudentsToCache]);

  return {
    getCachedStudents,
    findStudentByUniqueId,
    syncStudentsToCache,
    isCacheStale,
    getCacheStats,
    clearCache,
    isLoading,
    lastSync,
  };
};
