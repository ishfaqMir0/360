import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface UseSupabaseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T>(
  tableName: string,
  query?: (queryBuilder: any) => any,
  options: UseSupabaseQueryOptions = {}
): UseSupabaseQueryResult<T> {
  const { session } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { enabled = true, refetchOnMount = true } = options;

  const fetchData = useCallback(async () => {
    if (!enabled || !session?.user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let queryBuilder = supabase.from(tableName).select('*');
      
      // Apply user filter for user-specific tables
      if (['profiles', 'fields', 'activities', 'notifications', 'tasks', 'expenses', 'harvests', 'field_analytics'].includes(tableName)) {
        queryBuilder = queryBuilder.eq('user_id', session.user.id);
      }

      // Apply custom query if provided
      if (query) {
        queryBuilder = query(queryBuilder);
      }

      const { data: result, error: fetchError } = await queryBuilder;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setData(result as T);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [tableName, query, enabled, session?.user]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useSupabaseMutation<T = any>(tableName: string) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (data: Partial<T>) => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const insertData = {
        ...data,
        user_id: session.user.id,
      };

      const { data: result, error: insertError } = await supabase
        .from(tableName)
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, session?.user]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: updateError } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, session?.user]);

  const remove = useCallback(async (id: string) => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, session?.user]);

  return {
    insert,
    update,
    remove,
    loading,
    error,
  };
}