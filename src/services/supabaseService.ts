import { supabase } from '../lib/supabaseClient';
import type { User, Field } from '../types';

// Profile Services
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        farm_name: updates.farmName,
        khasra_number: updates.khasraNumber,
        khata_number: updates.khataNumber,
        whatsapp: updates.whatsapp,
        address: updates.address,
        language: updates.language,
        currency: updates.currency,
        avatar_url: updates.avatar,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },
};

// Field Services
export const fieldService = {
  async getFields(userId: string) {
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createField(userId: string, fieldData: Omit<Field, 'id'>) {
    const { data, error } = await supabase
      .from('fields')
      .insert([{
        user_id: userId,
        name: fieldData.name,
        area: fieldData.area,
        soil_type: fieldData.soilType,
        crop_stage: fieldData.cropStage,
        health_status: fieldData.healthStatus,
        location: fieldData.location,
        planted_date: fieldData.plantedDate || null,
        latitude: fieldData.latitude,
        longitude: fieldData.longitude,
        boundary_path: fieldData.boundaryPath || [],
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateField(userId: string, fieldId: string, updates: Partial<Field>) {
    const { data, error } = await supabase
      .from('fields')
      .update({
        name: updates.name,
        area: updates.area,
        soil_type: updates.soilType,
        crop_stage: updates.cropStage,
        health_status: updates.healthStatus,
        location: updates.location,
        planted_date: updates.plantedDate || null,
        latitude: updates.latitude,
        longitude: updates.longitude,
        boundary_path: updates.boundaryPath || [],
      })
      .eq('id', fieldId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteField(userId: string, fieldId: string) {
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', fieldId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },

  async getFieldStats(fieldId: string) {
    const { data, error } = await supabase
      .rpc('calculate_field_stats', { field_uuid: fieldId });

    if (error) throw error;
    return data;
  },
};

// Activity Services
export const activityService = {
  async getActivities(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('activities')
      .select('*, fields(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async createActivity(userId: string, activity: {
    title: string;
    description?: string;
    kind?: 'success' | 'warning' | 'info' | 'error';
    fieldId?: string;
    metadata?: any;
  }) {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        user_id: userId,
        field_id: activity.fieldId || null,
        title: activity.title,
        description: activity.description,
        kind: activity.kind || 'info',
        metadata: activity.metadata || {},
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Weather Services
export const weatherService = {
  async getWeatherData(userId: string, location: string) {
    const { data, error } = await supabase
      .from('weather_data')
      .select('*')
      .eq('user_id', userId)
      .eq('location', location)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  async saveWeatherData(userId: string, weatherData: {
    location: string;
    latitude?: number;
    longitude?: number;
    temperature?: number;
    humidity?: number;
    precipitation?: number;
    windSpeed?: number;
    weatherCondition?: string;
    forecastData?: any;
  }) {
    const { data, error } = await supabase
      .from('weather_data')
      .insert([{
        user_id: userId,
        location: weatherData.location,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        precipitation: weatherData.precipitation,
        wind_speed: weatherData.windSpeed,
        weather_condition: weatherData.weatherCondition,
        forecast_data: weatherData.forecastData || {},
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Notification Services
export const notificationService = {
  async getNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async markAsRead(userId: string, notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },

  async createNotification(userId: string, notification: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'error';
    actionUrl?: string;
    metadata?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        action_url: notification.actionUrl,
        metadata: notification.metadata || {},
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Task Services
export const taskService = {
  async getTasks(userId: string, status?: string) {
    let query = supabase
      .from('tasks')
      .select('*, fields(name)')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTask(userId: string, task: {
    title: string;
    description?: string;
    fieldId?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    tags?: string[];
  }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: userId,
        field_id: task.fieldId || null,
        title: task.title,
        description: task.description,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.dueDate,
        tags: task.tags || [],
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(userId: string, taskId: string, updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    completedAt?: string;
  }) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.dueDate,
        completed_at: updates.completedAt,
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Expense Services
export const expenseService = {
  async getExpenses(userId: string, fieldId?: string) {
    let query = supabase
      .from('expenses')
      .select('*, fields(name)')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false });

    if (fieldId) {
      query = query.eq('field_id', fieldId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createExpense(userId: string, expense: {
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    category: string;
    expenseDate: string;
    fieldId?: string;
    paymentMethod?: string;
    tags?: string[];
  }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: userId,
        field_id: expense.fieldId || null,
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency || 'INR',
        category: expense.category,
        expense_date: expense.expenseDate,
        payment_method: expense.paymentMethod,
        tags: expense.tags || [],
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Harvest Services
export const harvestService = {
  async getHarvests(userId: string, fieldId?: string) {
    let query = supabase
      .from('harvests')
      .select('*, fields(name)')
      .eq('user_id', userId)
      .order('harvest_date', { ascending: false });

    if (fieldId) {
      query = query.eq('field_id', fieldId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createHarvest(userId: string, harvest: {
    fieldId: string;
    harvestDate: string;
    quantity: number;
    unit?: string;
    qualityGrade?: string;
    pricePerUnit?: number;
    buyerName?: string;
    buyerContact?: string;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('harvests')
      .insert([{
        user_id: userId,
        field_id: harvest.fieldId,
        harvest_date: harvest.harvestDate,
        quantity: harvest.quantity,
        unit: harvest.unit || 'kg',
        quality_grade: harvest.qualityGrade || 'A',
        price_per_unit: harvest.pricePerUnit || 0,
        buyer_name: harvest.buyerName,
        buyer_contact: harvest.buyerContact,
        notes: harvest.notes,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Analytics Services
export const analyticsService = {
  async getFieldAnalytics(userId: string, fieldId?: string) {
    let query = supabase
      .from('field_analytics')
      .select('*, fields(name)')
      .eq('user_id', userId)
      .order('recorded_date', { ascending: false });

    if (fieldId) {
      query = query.eq('field_id', fieldId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getDashboardStats(userId: string) {
    // Get field count
    const { count: fieldCount } = await supabase
      .from('fields')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get recent activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get unread notifications
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    // Get pending tasks
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    return {
      fieldCount: fieldCount || 0,
      activities: activities || [],
      unreadNotifications: unreadNotifications || 0,
      pendingTasks: pendingTasks || 0,
    };
  },
};