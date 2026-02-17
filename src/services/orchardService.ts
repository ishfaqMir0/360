import { supabase } from '../lib/supabaseClient';

export interface TreeTag {
  id: string;
  name: string;
  variety: string;
  rowNumber: string;
  latitude: number;
  longitude: number;
  healthStatus?: string;
  plantedDate?: string;
  notes?: string;
}

export interface OrchardVariety {
  id: string;
  varietyName: string;
  varietyType: 'traditional' | 'high_density' | 'exotic';
  role: 'main' | 'pollinator' | 'both';
  totalTrees: number;
  plantedTrees: number;
  healthyTrees: number;
  productionPerTree: number;
  expectedYield: number;
  actualYield: number;
  plantingDate?: string;
  firstHarvestDate?: string;
  notes?: string;
}

export interface ProductionRecord {
  id: string;
  varietyName: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  qualityGrade: string;
  pricePerUnit: number;
  totalValue: number;
  buyerName?: string;
  buyerContact?: string;
  weatherConditions?: string;
  notes?: string;
  images?: string[];
}

export interface FieldAnalytics {
  id: string;
  name: string;
  area: number;
  taggedTrees: number;
  totalVarieties: number;
  totalPlannedTrees: number;
  totalHarvests: number;
  totalProductionKg: number;
  totalProductionValue: number;
  averageQuality: string;
  latestHarvestDate?: string;
  latestHarvestQuantity?: number;
}

// Tree Tags Service
export const treeTagService = {
  async getTreeTags(userId: string, fieldId: string): Promise<TreeTag[]> {
    const { data, error } = await supabase
      .from('tree_tags')
      .select('*')
      .eq('user_id', userId)
      .eq('field_id', fieldId)
      .order('row_number', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name || '',
      variety: row.variety || '',
      rowNumber: row.row_number?.toString() || '',
      latitude: row.latitude || 0,
      longitude: row.longitude || 0,
      healthStatus: row.health_status,
      plantedDate: row.planted_date,
      notes: row.notes,
    }));
  },

  async createTreeTag(userId: string, fieldId: string, treeTag: Omit<TreeTag, 'id'>): Promise<TreeTag> {
    const { data, error } = await supabase
      .from('tree_tags')
      .insert({
        user_id: userId,
        field_id: fieldId,
        name: treeTag.name,
        variety: treeTag.variety,
        row_number: parseInt(treeTag.rowNumber) || null,
        latitude: treeTag.latitude,
        longitude: treeTag.longitude,
        health_status: treeTag.healthStatus || 'Good',
        planted_date: treeTag.plantedDate || null,
        notes: treeTag.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name || '',
      variety: data.variety || '',
      rowNumber: data.row_number?.toString() || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      healthStatus: data.health_status,
      plantedDate: data.planted_date,
      notes: data.notes,
    };
  },

  async updateTreeTag(userId: string, tagId: string, updates: Partial<TreeTag>): Promise<TreeTag> {
    const { data, error } = await supabase
      .from('tree_tags')
      .update({
        name: updates.name,
        variety: updates.variety,
        row_number: updates.rowNumber ? parseInt(updates.rowNumber) : null,
        latitude: updates.latitude,
        longitude: updates.longitude,
        health_status: updates.healthStatus,
        planted_date: updates.plantedDate,
        notes: updates.notes,
      })
      .eq('id', tagId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name || '',
      variety: data.variety || '',
      rowNumber: data.row_number?.toString() || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      healthStatus: data.health_status,
      plantedDate: data.planted_date,
      notes: data.notes,
    };
  },

  async deleteTreeTag(userId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('tree_tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

// Orchard Varieties Service
export const orchardVarietyService = {
  async getOrchardVarieties(userId: string, fieldId: string): Promise<OrchardVariety[]> {
    const { data, error } = await supabase
      .from('orchard_varieties')
      .select('*')
      .eq('user_id', userId)
      .eq('field_id', fieldId)
      .order('variety_name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      varietyName: row.variety_name,
      varietyType: row.variety_type || 'traditional',
      role: row.role || 'main',
      totalTrees: row.total_trees || 0,
      plantedTrees: row.planted_trees || 0,
      healthyTrees: row.healthy_trees || 0,
      productionPerTree: row.production_per_tree || 0,
      expectedYield: row.expected_yield || 0,
      actualYield: row.actual_yield || 0,
      plantingDate: row.planting_date,
      firstHarvestDate: row.first_harvest_date,
      notes: row.notes,
    }));
  },

  async createOrchardVariety(userId: string, fieldId: string, variety: Omit<OrchardVariety, 'id'>): Promise<OrchardVariety> {
    const { data, error } = await supabase
      .from('orchard_varieties')
      .insert({
        user_id: userId,
        field_id: fieldId,
        variety_name: variety.varietyName,
        variety_type: variety.varietyType,
        role: variety.role,
        total_trees: variety.totalTrees,
        planted_trees: variety.plantedTrees,
        healthy_trees: variety.healthyTrees,
        production_per_tree: variety.productionPerTree,
        expected_yield: variety.expectedYield,
        actual_yield: variety.actualYield,
        planting_date: variety.plantingDate || null,
        first_harvest_date: variety.firstHarvestDate || null,
        notes: variety.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      varietyName: data.variety_name,
      varietyType: data.variety_type || 'traditional',
      role: data.role || 'main',
      totalTrees: data.total_trees || 0,
      plantedTrees: data.planted_trees || 0,
      healthyTrees: data.healthy_trees || 0,
      productionPerTree: data.production_per_tree || 0,
      expectedYield: data.expected_yield || 0,
      actualYield: data.actual_yield || 0,
      plantingDate: data.planting_date,
      firstHarvestDate: data.first_harvest_date,
      notes: data.notes,
    };
  },

  async updateOrchardVariety(userId: string, varietyId: string, updates: Partial<OrchardVariety>): Promise<OrchardVariety> {
    const { data, error } = await supabase
      .from('orchard_varieties')
      .update({
        variety_name: updates.varietyName,
        variety_type: updates.varietyType,
        role: updates.role,
        total_trees: updates.totalTrees,
        planted_trees: updates.plantedTrees,
        healthy_trees: updates.healthyTrees,
        production_per_tree: updates.productionPerTree,
        expected_yield: updates.expectedYield,
        actual_yield: updates.actualYield,
        planting_date: updates.plantingDate,
        first_harvest_date: updates.firstHarvestDate,
        notes: updates.notes,
      })
      .eq('id', varietyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      varietyName: data.variety_name,
      varietyType: data.variety_type || 'traditional',
      role: data.role || 'main',
      totalTrees: data.total_trees || 0,
      plantedTrees: data.planted_trees || 0,
      healthyTrees: data.healthy_trees || 0,
      productionPerTree: data.production_per_tree || 0,
      expectedYield: data.expected_yield || 0,
      actualYield: data.actual_yield || 0,
      plantingDate: data.planting_date,
      firstHarvestDate: data.first_harvest_date,
      notes: data.notes,
    };
  },
};

// Production Records Service
export const productionService = {
  async getProductionRecords(userId: string, fieldId?: string): Promise<ProductionRecord[]> {
    let query = supabase
      .from('production_records')
      .select('*')
      .eq('user_id', userId)
      .order('harvest_date', { ascending: false });

    if (fieldId) {
      query = query.eq('field_id', fieldId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      varietyName: row.variety_name,
      harvestDate: row.harvest_date,
      quantity: row.quantity || 0,
      unit: row.unit || 'kg',
      qualityGrade: row.quality_grade || 'A',
      pricePerUnit: row.price_per_unit || 0,
      totalValue: row.total_value || 0,
      buyerName: row.buyer_name,
      buyerContact: row.buyer_contact,
      weatherConditions: row.weather_conditions,
      notes: row.notes,
      images: row.images || [],
    }));
  },

  async createProductionRecord(userId: string, fieldId: string, record: Omit<ProductionRecord, 'id' | 'totalValue'>): Promise<ProductionRecord> {
    const { data, error } = await supabase
      .from('production_records')
      .insert({
        user_id: userId,
        field_id: fieldId,
        variety_name: record.varietyName,
        harvest_date: record.harvestDate,
        quantity: record.quantity,
        unit: record.unit,
        quality_grade: record.qualityGrade,
        price_per_unit: record.pricePerUnit,
        buyer_name: record.buyerName,
        buyer_contact: record.buyerContact,
        weather_conditions: record.weatherConditions,
        notes: record.notes,
        images: record.images || [],
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      varietyName: data.variety_name,
      harvestDate: data.harvest_date,
      quantity: data.quantity || 0,
      unit: data.unit || 'kg',
      qualityGrade: data.quality_grade || 'A',
      pricePerUnit: data.price_per_unit || 0,
      totalValue: data.total_value || 0,
      buyerName: data.buyer_name,
      buyerContact: data.buyer_contact,
      weatherConditions: data.weather_conditions,
      notes: data.notes,
      images: data.images || [],
    };
  },
};

// Field Analytics Service
export const fieldAnalyticsService = {
  async getFieldAnalytics(userId: string): Promise<FieldAnalytics[]> {
    const { data, error } = await supabase
      .from('field_analytics_view')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      area: row.area || 0,
      taggedTrees: row.tagged_trees || 0,
      totalVarieties: row.total_varieties || 0,
      totalPlannedTrees: row.total_planned_trees || 0,
      totalHarvests: row.total_harvests || 0,
      totalProductionKg: row.total_production_kg || 0,
      totalProductionValue: row.total_production_value || 0,
      averageQuality: row.average_quality || 'N/A',
      latestHarvestDate: row.latest_harvest_date,
      latestHarvestQuantity: row.latest_harvest_quantity || 0,
    }));
  },

  async getFieldSummary(userId: string, fieldId: string) {
    // Get comprehensive field data
    const [fieldData, varieties, treeTags, production] = await Promise.all([
      supabase.from('fields').select('*').eq('id', fieldId).eq('user_id', userId).single(),
      orchardVarietyService.getOrchardVarieties(userId, fieldId),
      treeTagService.getTreeTags(userId, fieldId),
      productionService.getProductionRecords(userId, fieldId),
    ]);

    if (fieldData.error) throw fieldData.error;

    return {
      field: fieldData.data,
      varieties,
      treeTags,
      production,
      summary: {
        totalVarieties: varieties.length,
        totalTaggedTrees: treeTags.length,
        totalPlannedTrees: varieties.reduce((sum, v) => sum + v.totalTrees, 0),
        totalProduction: production.reduce((sum, p) => sum + p.quantity, 0),
        totalValue: production.reduce((sum, p) => sum + p.totalValue, 0),
        averageYield: varieties.length > 0 
          ? varieties.reduce((sum, v) => sum + v.productionPerTree, 0) / varieties.length 
          : 0,
      },
    };
  },
};

// Comprehensive orchard management service
export const orchardService = {
  treeTag: treeTagService,
  variety: orchardVarietyService,
  production: productionService,
  analytics: fieldAnalyticsService,

  // Bulk operations
  async syncVarietiesFromFormData(userId: string, fieldId: string, varietyTrees: Array<{variety: string, totalTrees: string}>) {
    // Clear existing varieties
    await supabase
      .from('orchard_varieties')
      .delete()
      .eq('user_id', userId)
      .eq('field_id', fieldId);

    // Insert new varieties
    const varieties = varietyTrees
      .filter(vt => vt.variety && vt.totalTrees)
      .map(vt => ({
        user_id: userId,
        field_id: fieldId,
        variety_name: vt.variety,
        variety_type: 'traditional' as const, // Default, can be enhanced
        role: 'main' as const, // Default, can be enhanced
        total_trees: parseInt(vt.totalTrees) || 0,
        planted_trees: parseInt(vt.totalTrees) || 0,
        healthy_trees: Math.floor((parseInt(vt.totalTrees) || 0) * 0.95), // Assume 95% healthy
      }));

    if (varieties.length > 0) {
      const { error } = await supabase
        .from('orchard_varieties')
        .insert(varieties);

      if (error) throw error;
    }
  },

  async syncTreeTagsFromFormData(userId: string, fieldId: string, treeTags: TreeTag[]) {
    // Clear existing tree tags
    await supabase
      .from('tree_tags')
      .delete()
      .eq('user_id', userId)
      .eq('field_id', fieldId);

    // Insert new tree tags
    if (treeTags.length > 0) {
      const tags = treeTags.map(tag => ({
        user_id: userId,
        field_id: fieldId,
        name: tag.name,
        variety: tag.variety,
        row_number: parseInt(tag.rowNumber) || null,
        latitude: tag.latitude,
        longitude: tag.longitude,
        health_status: 'Good',
      }));

      const { error } = await supabase
        .from('tree_tags')
        .insert(tags);

      if (error) throw error;
    }
  },
};