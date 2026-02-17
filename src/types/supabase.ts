export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          farm_name: string | null;
          avatar_url: string | null;
          khasra_number: string | null;
          khata_number: string | null;
          whatsapp: string | null;
          address: string | null;
          language: string | null;
          currency: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          farm_name?: string | null;
          avatar_url?: string | null;
          khasra_number?: string | null;
          khata_number?: string | null;
          whatsapp?: string | null;
          address?: string | null;
          language?: string | null;
          currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          farm_name?: string | null;
          avatar_url?: string | null;
          khasra_number?: string | null;
          khata_number?: string | null;
          whatsapp?: string | null;
          address?: string | null;
          language?: string | null;
          currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fields: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          area: number | null;
          soil_type: string | null;
          crop_stage: string | null;
          health_status: string | null;
          location: string | null;
          planted_date: string | null;
          latitude: number | null;
          longitude: number | null;
          boundary_path: any | null;
          details: any | null;
          image_urls: string[] | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          area?: number | null;
          soil_type?: string | null;
          crop_stage?: string | null;
          health_status?: string | null;
          location?: string | null;
          planted_date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          boundary_path?: any | null;
          details?: any | null;
          image_urls?: string[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          area?: number | null;
          soil_type?: string | null;
          crop_stage?: string | null;
          health_status?: string | null;
          location?: string | null;
          planted_date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          boundary_path?: any | null;
          details?: any | null;
          image_urls?: string[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          field_id: string | null;
          title: string;
          description: string | null;
          kind: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id?: string | null;
          title: string;
          description?: string | null;
          kind?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string | null;
          title?: string;
          description?: string | null;
          kind?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      weather_data: {
        Row: {
          id: string;
          user_id: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          temperature: number | null;
          humidity: number | null;
          precipitation: number | null;
          wind_speed: number | null;
          weather_condition: string | null;
          forecast_data: any | null;
          data_source: string | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location: string;
          latitude?: number | null;
          longitude?: number | null;
          temperature?: number | null;
          humidity?: number | null;
          precipitation?: number | null;
          wind_speed?: number | null;
          weather_condition?: string | null;
          forecast_data?: any | null;
          data_source?: string | null;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          temperature?: number | null;
          humidity?: number | null;
          precipitation?: number | null;
          wind_speed?: number | null;
          weather_condition?: string | null;
          forecast_data?: any | null;
          data_source?: string | null;
          recorded_at?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string | null;
          read: boolean | null;
          action_url: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string | null;
          read?: boolean | null;
          action_url?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string | null;
          read?: boolean | null;
          action_url?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      field_analytics: {
        Row: {
          id: string;
          user_id: string;
          field_id: string;
          metric_type: string;
          metric_value: number;
          unit: string | null;
          recorded_date: string;
          notes: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id: string;
          metric_type: string;
          metric_value: number;
          unit?: string | null;
          recorded_date?: string;
          notes?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string;
          metric_type?: string;
          metric_value?: number;
          unit?: string | null;
          recorded_date?: string;
          notes?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          field_id: string | null;
          title: string;
          description: string | null;
          status: string | null;
          priority: string | null;
          due_date: string | null;
          completed_at: string | null;
          assigned_to: string | null;
          tags: string[] | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id?: string | null;
          title: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          assigned_to?: string | null;
          tags?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          assigned_to?: string | null;
          tags?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          field_id: string | null;
          title: string;
          description: string | null;
          amount: number;
          currency: string | null;
          category: string;
          expense_date: string;
          payment_method: string | null;
          receipt_url: string | null;
          tags: string[] | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id?: string | null;
          title: string;
          description?: string | null;
          amount: number;
          currency?: string | null;
          category: string;
          expense_date: string;
          payment_method?: string | null;
          receipt_url?: string | null;
          tags?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string | null;
          title?: string;
          description?: string | null;
          amount?: number;
          currency?: string | null;
          category?: string;
          expense_date?: string;
          payment_method?: string | null;
          receipt_url?: string | null;
          tags?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      harvests: {
        Row: {
          id: string;
          user_id: string;
          field_id: string;
          harvest_date: string;
          quantity: number;
          unit: string | null;
          quality_grade: string | null;
          price_per_unit: number | null;
          total_value: number | null;
          buyer_name: string | null;
          buyer_contact: string | null;
          notes: string | null;
          images: string[] | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id: string;
          harvest_date: string;
          quantity: number;
          unit?: string | null;
          quality_grade?: string | null;
          price_per_unit?: number | null;
          buyer_name?: string | null;
          buyer_contact?: string | null;
          notes?: string | null;
          images?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string;
          harvest_date?: string;
          quantity?: number;
          unit?: string | null;
          quality_grade?: string | null;
          price_per_unit?: number | null;
          buyer_name?: string | null;
          buyer_contact?: string | null;
          notes?: string | null;
          images?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      field_summary: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          area: number | null;
          health_status: string | null;
          crop_stage: string | null;
          location: string | null;
          total_harvest: number | null;
          total_expenses: number | null;
          net_profit: number | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      calculate_field_stats: {
        Args: {
          field_uuid: string;
        };
        Returns: any;
      };
    };
  };
}