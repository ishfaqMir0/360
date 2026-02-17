import React, { useState, useEffect, useRef } from 'react';
import { MapPin, TreePine, TriangleAlert as AlertTriangle, Cloud, TrendingUp, Calendar, UserCircle, CheckCircle2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import type { User, Field } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { orchardService } from '../services/orchardService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Array<{ id: string; title: string; createdAt: string; kind: 'success' | 'warning' | 'info' }>>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [orchardData, setOrchardData] = useState<{ [fieldId: string]: { varieties: any[], treeTags: any[] } }>({});
  const { user, session } = useAuth();

  const profileUser: User = user ?? {
    id: session?.user.id ?? '',
    name: session?.user.user_metadata?.name ?? '',
    email: session?.user.email ?? '',
    phone: session?.user.user_metadata?.phone ?? '',
    farmName: '',
  };

  const calculateProfileCompletion = (user: User): number => {
    let completed = 0;
    const totalFields = 7;

    // Required fields (4)
    if (user.name?.trim()) completed++;
    if (user.email?.trim()) completed++;
    if (user.phone?.trim()) completed++;
    if (user.farmName?.trim()) completed++;

    // Optional fields (3)
    if (user.avatar?.trim()) completed++;
    if (user.khasraNumber?.trim()) completed++;
    if (user.khataNumber?.trim()) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const profileCompletion = calculateProfileCompletion(profileUser);

  useEffect(() => {
    const loadTomorrowMaps = () => {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        const leafletJS = document.createElement('script');
        leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletJS.onload = () => setMapsLoaded(true);
        document.head.appendChild(leafletJS);
      } else {
        setMapsLoaded(true);
      }
    };

    loadTomorrowMaps();
  }, []);

  useEffect(() => {
    const loadFields = async () => {
      if (!session?.user) {
        setFields([]);
        setLoadingFields(false);
        return;
      }

      setLoadingFields(true);
      setFieldsError(null);

      const { data, error } = await supabase
        .from('fields')
        .select(
          'id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path'
        )
        .eq('user_id', session.user.id);

      if (error) {
        setFieldsError(error.message);
        setLoadingFields(false);
        return;
      }

      const mappedFields: Field[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        area: row.area ?? 0,
        soilType: row.soil_type ?? 'Unknown',
        cropStage: row.crop_stage ?? 'Growing',
        healthStatus: row.health_status ?? 'Good',
        location: row.location ?? 'Unknown',
        plantedDate: row.planted_date ?? '',
        latitude: row.latitude ?? undefined,
        longitude: row.longitude ?? undefined,
        boundaryPath: row.boundary_path ?? undefined,
      }));

      setFields(mappedFields);
      setLoadingFields(false);

      // Load orchard data for each field
      const orchardDataPromises = mappedFields.map(async (field) => {
        try {
          const [varieties, treeTags] = await Promise.all([
            orchardService.variety.getOrchardVarieties(session.user.id, field.id),
            orchardService.treeTag.getTreeTags(session.user.id, field.id)
          ]);
          return { fieldId: field.id, varieties, treeTags };
        } catch (error) {
          console.error(`Error loading orchard data for field ${field.id}:`, error);
          return { fieldId: field.id, varieties: [], treeTags: [] };
        }
      });

      Promise.all(orchardDataPromises).then((results) => {
        const orchardDataMap = results.reduce((acc, { fieldId, varieties, treeTags }) => {
          acc[fieldId] = { varieties, treeTags };
          return acc;
        }, {} as { [fieldId: string]: { varieties: any[], treeTags: any[] } });
        setOrchardData(orchardDataMap);
      });
    };

    loadFields();
  }, [session?.user]);

  useEffect(() => {
    const loadActivities = async () => {
      if (!session?.user) {
        setActivities([]);
        setActivityError(null);
        return;
      }

      setActivityError(null);

      const { data, error } = await supabase
        .from('activities')
        .select('id, title, created_at, kind')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        setActivityError(error.message);
        return;
      }

      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        kind: row.kind ?? 'info',
      }));

      setActivities(mapped);
    };

    loadActivities();
  }, [session?.user]);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || fields.length === 0 || !(window as any).L) {
      return;
    }

    const L = (window as any).L;
    
    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Calculate center based on all fields
    const fieldsWithCoords = fields.filter(f => f.latitude && f.longitude);
    if (fieldsWithCoords.length === 0) {
      return;
    }

    const avgLat = fieldsWithCoords.reduce((sum, f) => sum + (f.latitude || 0), 0) / fieldsWithCoords.length;
    const avgLng = fieldsWithCoords.reduce((sum, f) => sum + (f.longitude || 0), 0) / fieldsWithCoords.length;

    // Initialize Leaflet map
    const map = L.map(mapRef.current).setView([avgLat, avgLng], 12);

    // Add Tomorrow.ai satellite layer
    const tomorrowApiKey = '43EFDUKlRuMKRQRdJIVfABgN3pVbsWK7z';
    L.tileLayer(`https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/satellite/recent.png?apikey=${tomorrowApiKey}`, {
      attribution: '© Tomorrow.io',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Define variety colors
    const varietyColors: { [key: string]: string } = {
      'Red Delicious / Delicious': '#dc2626', // red-600
      'Kashmir Golden / Golden Delicious': '#f59e0b', // amber-500
      'Ambri': '#7c3aed', // violet-600
      'Gala Scarlet / Redlum Gala': '#ef4444', // red-500
      'Auvi Fuji': '#06b6d4', // cyan-500
      'Scarlet Spur-II': '#ec4899', // pink-500
      'Super Chief': '#10b981', // emerald-500
      'default': '#6b7280' // gray-500
    };

    // Add field boundaries and tree visualization
    fieldsWithCoords.forEach((field) => {
      const fieldOrchardData = orchardData[field.id];
      
      // Add field boundary if available
      if (field.boundaryPath && field.boundaryPath.length > 0) {
        const boundaryCoords = field.boundaryPath.map((point: any) => [point.lat, point.lng]);
        const polygon = L.polygon(boundaryCoords, {
          color: '#059669', // emerald-600
          weight: 2,
          fillOpacity: 0.1,
          fillColor: '#10b981' // emerald-500
        }).addTo(map);

        polygon.bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${field.name}</h3>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              <div><strong>Area:</strong> ${field.area} kanal</div>
              <div><strong>Status:</strong> ${field.healthStatus}</div>
              <div><strong>Stage:</strong> ${field.cropStage}</div>
            </div>
            ${fieldOrchardData ? `
              <div style="font-size: 11px; color: #4b5563;">
                <div><strong>Varieties:</strong> ${fieldOrchardData.varieties.length}</div>
                <div><strong>Tagged Trees:</strong> ${fieldOrchardData.treeTags.length}</div>
              </div>
            ` : ''}
          </div>
        `);
      }

      // Add center marker for field
      const marker = L.circleMarker([field.latitude!, field.longitude!], {
        radius: 8,
        fillColor: '#059669',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${field.name}</h3>
          <div style="font-size: 12px; color: #6b7280;">
            <div>Area: ${field.area} kanal</div>
            <div>Status: ${field.healthStatus}</div>
          </div>
        </div>
      `);

      // Add tree tags with variety-based colors
      if (fieldOrchardData && fieldOrchardData.treeTags.length > 0) {
        fieldOrchardData.treeTags.forEach((tree: any) => {
          const varietyColor = varietyColors[tree.variety] || varietyColors.default;
          
          const treeMarker = L.circleMarker([tree.latitude, tree.longitude], {
            radius: 4,
            fillColor: varietyColor,
            color: '#ffffff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map);

          treeMarker.bindPopup(`
            <div style="padding: 6px; min-width: 150px;">
              <h4 style="font-weight: 600; margin-bottom: 4px; color: #1f2937;">${tree.name}</h4>
              <div style="font-size: 11px; color: #6b7280;">
                <div><strong>Variety:</strong> ${tree.variety}</div>
                <div><strong>Row:</strong> ${tree.rowNumber}</div>
                <div><strong>Health:</strong> ${tree.healthStatus}</div>
              </div>
            </div>
          `);
        });
      }

      // Visualize tree rows based on orchard details
      if (field.boundaryPath && field.boundaryPath.length > 0) {
        try {
          const details = typeof field.details === 'string' ? JSON.parse(field.details) : field.details;
          if (details && details.numberOfRows && details.treesPerRow) {
            const numberOfRows = parseInt(details.numberOfRows);
            const treesPerRow = parseInt(details.treesPerRow);
            
            if (numberOfRows > 0 && treesPerRow > 0) {
              // Calculate row positions within boundary
              const boundary = field.boundaryPath;
              const minLat = Math.min(...boundary.map((p: any) => p.lat));
              const maxLat = Math.max(...boundary.map((p: any) => p.lat));
              const minLng = Math.min(...boundary.map((p: any) => p.lng));
              const maxLng = Math.max(...boundary.map((p: any) => p.lng));
              
              const latStep = (maxLat - minLat) / (numberOfRows + 1);
              const lngStep = (maxLng - minLng) / (treesPerRow + 1);
              
              // Draw tree rows
              for (let row = 1; row <= numberOfRows; row++) {
                const rowLat = minLat + (row * latStep);
                
                // Draw row line
                const rowLine = L.polyline([
                  [rowLat, minLng + lngStep],
                  [rowLat, maxLng - lngStep]
                ], {
                  color: '#9ca3af',
                  weight: 1,
                  opacity: 0.6,
                  dashArray: '5, 5'
                }).addTo(map);
                
                // Add tree positions along the row
                for (let tree = 1; tree <= treesPerRow; tree++) {
                  const treeLng = minLng + (tree * lngStep);
                  
                  // Get variety for this position (if available from varietyTrees data)
                  let treeVariety = 'Unknown';
                  let varietyColor = varietyColors.default;
                  
                  if (details.varietyTrees && details.varietyTrees.length > 0) {
                    const totalTrees = details.varietyTrees.reduce((sum: number, v: any) => sum + parseInt(v.totalTrees || 0), 0);
                    const currentTreeIndex = ((row - 1) * treesPerRow) + tree - 1;
                    
                    let runningTotal = 0;
                    for (const varietyData of details.varietyTrees) {
                      runningTotal += parseInt(varietyData.totalTrees || 0);
                      if (currentTreeIndex < runningTotal) {
                        treeVariety = varietyData.variety;
                        varietyColor = varietyColors[treeVariety] || varietyColors.default;
                        break;
                      }
                    }
                  }
                  
                  const treeMarker = L.circleMarker([rowLat, treeLng], {
                    radius: 2,
                    fillColor: varietyColor,
                    color: varietyColor,
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.8
                  }).addTo(map);
                  
                  treeMarker.bindPopup(`
                    <div style="padding: 4px; min-width: 120px;">
                      <div style="font-size: 11px; color: #1f2937;">
                        <div><strong>Row:</strong> ${row}</div>
                        <div><strong>Position:</strong> ${tree}</div>
                        <div><strong>Variety:</strong> ${treeVariety}</div>
                      </div>
                    </div>
                  `);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing field details:', error);
        }
      }

      // Handle field selection
      marker.on('click', () => {
        setSelectedFieldId(field.id);
      });
    });

  }, [mapsLoaded, fields, orchardData]);

  const handleViewField = (field: Field) => {
    if (field.latitude && field.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([field.latitude, field.longitude], 16);
      setSelectedFieldId(field.id);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-green-600 bg-green-50';
      case 'Good':
        return 'text-blue-600 bg-blue-50';
      case 'Fair':
        return 'text-yellow-600 bg-yellow-50';
      case 'Poor':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityDotColor = (kind: 'success' | 'warning' | 'info') => {
    switch (kind) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const stats = [
    {
      title: 'Total Fields',
      value: fields.length,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Healthy Trees',
      value: '0',
      icon: TreePine,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Alerts',
      value: 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Weather',
      value: 'N/A',
      icon: Cloud,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Orchard Map Overview - First Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Orchard Map Overview</h2>
            <p className="text-sm text-gray-500">All saved fields and locations</p>
          </div>
          <Button onClick={() => navigate('/fields')} size="sm" variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            View All Fields
          </Button>
        </div>

        {fieldsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {fieldsError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 relative">
            {loadingFields ? (
              <div className="w-full h-96 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                <p className="text-sm text-gray-500">Loading fields...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="w-full h-96 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orchards Mapped Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Your saved orchards will appear here on the map</p>
                  <Button onClick={() => navigate('/fields')} size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Create Your First Orchard
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={mapRef}
                  className="w-full h-96 rounded-lg border border-gray-200 bg-gray-100"
                />
              </>
            )}
          </div>

          {/* Fields List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 sticky top-0 bg-white pb-2">
              Saved Fields ({fields.length})
            </h3>
            {loadingFields ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-500">Loading fields...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">No fields saved yet</p>
                <p className="text-xs text-gray-500 mb-4">Create your first orchard to see it here</p>
                <Button onClick={() => navigate('/fields')} size="sm">
                  Create Field
                </Button>
              </div>
            ) : (
              fields.map((field) => (
              <div
                key={field.id}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedFieldId === field.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 bg-white'
                }`}
                onClick={() => handleViewField(field)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{field.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getHealthStatusColor(field.healthStatus)}`}>
                    {field.healthStatus}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{field.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Area: {field.area} kanal</span>
                    <span>{field.cropStage}</span>
                  </div>
                  {field.latitude && field.longitude && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Navigation className="w-3 h-3" />
                      <span>{field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </Card>

      {/* Variety Legend */}
      {Object.keys(orchardData).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Apple Variety Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {Object.entries({
              'Red Delicious / Delicious': '#dc2626',
              'Kashmir Golden / Golden Delicious': '#f59e0b',
              'Ambri': '#7c3aed',
              'Gala Scarlet / Redlum Gala': '#ef4444',
              'Auvi Fuji': '#06b6d4',
              'Scarlet Spur-II': '#ec4899',
              'Super Chief': '#10b981'
            }).map(([variety, color]) => (
              <div key={variety} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600 truncate">{variety}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Profile Completion Card */}
      {profileCompletion < 100 && (
        <Card className="p-6 bg-linear-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <UserCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {profileCompletion}% Complete
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {profileCompletion < 100 
                    ? 'Add more information to unlock all features and get personalized recommendations.'
                    : 'Your profile is complete!'}
                </p>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Profile Progress</span>
                    <span className="font-medium">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-linear-to-r from-green-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {profileUser.name && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Name</span>}
                  {profileUser.email && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Email</span>}
                  {profileUser.phone && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Phone</span>}
                  {profileUser.farmName && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Farm Name</span>}
                  {profileUser.avatar && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Photo</span>}
                  {profileUser.khasraNumber && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Khasra</span>}
                  {profileUser.khataNumber && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Khata</span>}
                  {!profileUser.avatar && <span className="text-gray-400">Photo</span>}
                  {!profileUser.khasraNumber && <span className="text-gray-400">Khasra</span>}
                  {!profileUser.khataNumber && <span className="text-gray-400">Khata</span>}
                </div>
              </div>
            </div>
            <div>
              <Button 
                onClick={() => navigate('/profile')}
                size="sm"
                className="whitespace-nowrap"
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Production Overview</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600">Production Chart</p>
              <p className="text-sm text-gray-500">Chart visualization would go here</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Growth Analytics</h3>
            <TreePine className="w-5 h-5 text-green-600" />
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600">Growth Analytics</p>
              <p className="text-sm text-gray-500">Analytics visualization would go here</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {activityError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {activityError}
          </div>
        )}
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No recent activity yet.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 ${getActivityDotColor(activity.kind)} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;