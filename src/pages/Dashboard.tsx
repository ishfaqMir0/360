import React, { useState, useEffect, useRef } from 'react';
import { MapPin, TreePine, TriangleAlert as AlertTriangle, Cloud, TrendingUp, Calendar, UserCircle, CheckCircle2, Navigation } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import type { User, Field } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type TreeTag = {
  id: string;
  name: string;
  variety: string;
  rowNumber: string;
  latitude: number;
  longitude: number;
};

type FieldWithDetails = Field & {
  details?: {
    treeTags?: TreeTag[];
    rows?: Array<{
      rowId: string;
      varieties: Array<{ variety: string; trees: string }>;
    }>;
  };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const treeMarkersRef = useRef<any[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldWithDetails[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Array<{ id: string; title: string; createdAt: string; kind: 'success' | 'warning' | 'info' }>>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const location = useLocation();
  const focusFieldId = (location.state as any)?.focusFieldId ?? null;

  const varietyPalette = ['#22c55e', '#f97316', '#3b82f6', '#e11d48', '#a855f7', '#14b8a6'];

  const getVarietyColor = (variety: string) => {
    if (!variety) return '#6b7280';
    const hash = variety.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return varietyPalette[hash % varietyPalette.length];
  };

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

    if (user.name?.trim()) completed++;
    if (user.email?.trim()) completed++;
    if (user.phone?.trim()) completed++;
    if (user.farmName?.trim()) completed++;
    if (user.avatar?.trim()) completed++;
    if (user.khasraNumber?.trim()) completed++;
    if (user.khataNumber?.trim()) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const profileCompletion = calculateProfileCompletion(profileUser);

  // Calculate total statistics
  const totalArea = fields.reduce((sum, f) => sum + (f.area || 0), 0);
  const totalTrees = fields.reduce((sum, f) => {
    const treeTags = f.details?.treeTags || [];
    return sum + treeTags.length;
  }, 0);

  // Get all unique varieties across all fields
  const allVarieties = new Map<string, number>();
  fields.forEach(field => {
    const treeTags = field.details?.treeTags || [];
    treeTags.forEach(tag => {
      if (tag.variety) {
        allVarieties.set(tag.variety, (allVarieties.get(tag.variety) || 0) + 1);
      }
    });
  });

  useEffect(() => {
    const loadGoogleMaps = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      if (!apiKey) {
        return;
      }

      if ((window as any).google?.maps) {
        setMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
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
          'id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details'
        )
        .eq('user_id', session.user.id);

      if (error) {
        setFieldsError(error.message);
        setLoadingFields(false);
        return;
      }

      const mappedFields: FieldWithDetails[] = (data ?? []).map((row: any) => ({
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
        details: row.details ?? undefined,
      }));

      setFields(mappedFields);
      setLoadingFields(false);
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
    if (!mapsLoaded || !mapRef.current || fields.length === 0) {
      return;
    }

    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) {
      return;
    }

    // Clear previous map
    try {
      if (mapRef.current && mapInstanceRef.current) {
        mapRef.current.innerHTML = '';
        mapInstanceRef.current = null;
      }
    } catch (e) {
      // ignore
    }

    // Clear previous tree markers
    treeMarkersRef.current.forEach(marker => marker.setMap(null));
    treeMarkersRef.current = [];

    const fieldsWithCoords = fields.filter(f => f.latitude && f.longitude);
    if (fieldsWithCoords.length === 0) {
      return;
    }

    const avgLat = fieldsWithCoords.reduce((sum, f) => sum + (f.latitude || 0), 0) / fieldsWithCoords.length;
    const avgLng = fieldsWithCoords.reduce((sum, f) => sum + (f.longitude || 0), 0) / fieldsWithCoords.length;

    const map = new googleMaps.maps.Map(mapRef.current, {
      center: { lat: avgLat, lng: avgLng },
      zoom: 12,
      mapTypeId: 'satellite',
    });

    mapInstanceRef.current = map;

    const bounds = new googleMaps.maps.LatLngBounds();

    // Add field markers, boundaries, and tree tags
    fieldsWithCoords.forEach((field) => {
      const position = { lat: field.latitude!, lng: field.longitude! };

      // Field center marker
      const marker = new googleMaps.maps.Marker({
        position,
        map,
        title: field.name,
        label: {
          text: field.name.charAt(0),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });

      const treeTags = field.details?.treeTags || [];
      const infoContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; margin-bottom: 4px;">${field.name}</h3>
          <p style="font-size: 12px; color: #666; margin: 2px 0;">Area: ${field.area} kanal</p>
          <p style="font-size: 12px; color: #666; margin: 2px 0;">Status: ${field.healthStatus}</p>
          <p style="font-size: 12px; color: #666; margin: 2px 0;">Trees: ${treeTags.length}</p>
          ${treeTags.length > 0 ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px;">Varieties:</p>
              ${Array.from(new Set(treeTags.map(t => t.variety).filter(Boolean))).map(variety => {
                const count = treeTags.filter(t => t.variety === variety).length;
                const color = getVarietyColor(variety);
                return `<div style="display: flex; align-items: center; gap: 6px; margin: 2px 0; font-size: 11px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
                  <span style="color: #4b5563;">${variety}: ${count}</span>
                </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new googleMaps.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        setSelectedFieldId(field.id);
        infoWindow.open(map, marker);
      });

      bounds.extend(position as any);

      // Render boundary polygon
      if (field.boundaryPath) {
        let path: any = field.boundaryPath;

        if (typeof path === 'string') {
          try {
            path = JSON.parse(path);
          } catch (e) {
            // ignore
          }
        }

        if (Array.isArray(path) && path.length > 0) {
          if (Array.isArray(path[0]) && typeof path[0][0] === 'number') {
            path = path.map((pt: any) => ({ lat: pt[1], lng: pt[0] }));
          }

          const polygon = new googleMaps.maps.Polygon({
            paths: path,
            strokeColor: '#16a34a',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: '#a7f3d0',
            fillOpacity: 0.25,
          });

          polygon.setMap(map);

          (path as Array<any>).forEach((pt: any) => {
            if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
              bounds.extend({ lat: pt.lat, lng: pt.lng } as any);
            }
          });
        }
      }

      // Render tree tags as colored tree markers
      if (treeTags.length > 0) {
        treeTags.forEach(tag => {
          const color = getVarietyColor(tag.variety);
          const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
            `<circle cx="32" cy="24" r="18" fill="${color}" />` +
            `<rect x="28" y="36" width="8" height="18" fill="#8b5a2b"/>` +
            `</svg>`;

          const treeMarker = new googleMaps.maps.Marker({
            position: { lat: tag.latitude, lng: tag.longitude },
            map,
            title: `${tag.name} - ${tag.variety}`,
            icon: {
              url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
              scaledSize: new googleMaps.maps.Size(32, 32),
              anchor: new googleMaps.maps.Point(16, 32),
            },
          });

          const treeInfoContent = `
            <div style="padding: 8px;">
              <h4 style="font-weight: 600; margin-bottom: 4px;">${tag.name}</h4>
              <p style="font-size: 12px; color: #666; margin: 2px 0;">Variety: ${tag.variety}</p>
              <p style="font-size: 12px; color: #666; margin: 2px 0;">Row: ${tag.rowNumber}</p>
              <p style="font-size: 11px; color: #888; margin: 4px 0 0 0;">Field: ${field.name}</p>
            </div>
          `;

          const treeInfoWindow = new googleMaps.maps.InfoWindow({
            content: treeInfoContent,
          });

          treeMarker.addListener('click', () => {
            treeInfoWindow.open(map, treeMarker);
            map.panTo({ lat: tag.latitude, lng: tag.longitude });
            map.setZoom(18);
          });

          treeMarkersRef.current.push(treeMarker);
          bounds.extend({ lat: tag.latitude, lng: tag.longitude } as any);
        });
      }
    });

    // Fit map to bounds
    try {
      map.fitBounds(bounds);
    } catch (e) {
      // fallback
    }

    // Handle focus field from navigation
    if (focusFieldId) {
      const target = fields.find((f) => f.id === focusFieldId);
      if (target && target.latitude && target.longitude) {
        setTimeout(() => {
          map.panTo({ lat: target.latitude!, lng: target.longitude! });
          map.setZoom(16);
          setSelectedFieldId(target.id);
          try {
            navigate('/dashboard', { replace: true, state: {} });
          } catch (e) {
            // ignore
          }
        }, 300);
      }
    }
  }, [mapsLoaded, fields, focusFieldId]);

  const handleViewField = (field: FieldWithDetails) => {
    if (field.latitude && field.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: field.latitude, lng: field.longitude });
      mapInstanceRef.current.setZoom(16);
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
      title: 'Total Trees',
      value: totalTrees,
      icon: TreePine,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Area',
      value: `${totalArea.toFixed(1)} kanal`,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Varieties',
      value: allVarieties.size,
      icon: TreePine,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-white shadow rounded-2xl">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Variety Breakdown */}
      {allVarieties.size > 0 && (
        <Card className="p-6 bg-white shadow-xl rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variety Distribution Across All Fields</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(allVarieties.entries()).map(([variety, count]) => (
              <div key={variety} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: getVarietyColor(variety) }}
                  />
                  <span className="font-medium text-gray-900">{variety}</span>
                </div>
                <span className="text-lg font-bold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Orchard Map Overview */}
      <Card className="p-6 bg-white shadow-xl rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Orchard Map Overview</h2>
            <p className="text-sm text-gray-500">All fields with tree positions and boundaries</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/fields')} size="sm" variant="outline">
              <MapPin className="w-4 h-4 mr-2" />
              View All Fields
            </Button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 rounded-lg bg-white shadow hover:shadow-md border text-sm"
            >
              Refresh Map
            </button>
          </div>
        </div>

        {fieldsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {fieldsError}
          </div>
        )}

        <div className="space-y-6">
          {/* Map container */}
          <div className="relative">
            {loadingFields ? (
              <div className="w-full h-96 rounded-2xl shadow-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
                <p className="text-sm text-gray-500">Loading fields...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="w-full h-96 rounded-2xl shadow-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
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
                  className="w-full h-[680px] rounded-2xl shadow-2xl border border-gray-200 bg-gray-100 overflow-hidden"
                />
                {!import.meta.env.VITE_GOOGLE_API_KEY && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
                    <p className="text-sm text-gray-500">Map requires Google Maps API key</p>
                  </div>
                )}

                {/* Map Legend for Tree Varieties */}
                {allVarieties.size > 0 && (
                  <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-300 p-4 max-w-xs">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Tree Legend</h5>
                    <div className="space-y-2">
                      {Array.from(allVarieties.entries()).map(([variety, count]) => (
                        <div key={variety} className="flex items-center gap-2 text-xs">
                          <svg width="20" height="26" viewBox="0 0 64 64" className="flex-shrink-0">
                            <circle cx="32" cy="24" r="18" fill={getVarietyColor(variety)} />
                            <rect x="28" y="36" width="8" height="18" fill="#8b5a2b"/>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-gray-900">{variety}</div>
                            <div className="text-gray-500">{count} trees</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Saved fields below map */}
          <Card className="p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Fields ({fields.length})</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => {
                  const treeTags = field.details?.treeTags || [];
                  const fieldVarieties = new Map<string, number>();
                  treeTags.forEach(tag => {
                    if (tag.variety) {
                      fieldVarieties.set(tag.variety, (fieldVarieties.get(tag.variety) || 0) + 1);
                    }
                  });

                  return (
                    <Card
                      key={field.id}
                      className={`p-4 rounded-xl transition-all cursor-pointer hover:shadow-lg ${
                        selectedFieldId === field.id ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-200 bg-white'
                      }`}
                      onClick={() => handleViewField(field)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{field.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getHealthStatusColor(field.healthStatus)}`}>
                          {field.healthStatus}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{field.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Area: {field.area} kanal</span>
                          <span className="flex items-center gap-1">
                            <TreePine className="w-3 h-3" />
                            {treeTags.length} trees
                          </span>
                        </div>
                        {fieldVarieties.size > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Varieties:</p>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(fieldVarieties.entries()).map(([variety, count]) => (
                                <span
                                  key={variety}
                                  className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded border border-gray-300"
                                >
                                  <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: getVarietyColor(variety) }}
                                  />
                                  {count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </Card>

      {/* Profile Completion Card */}
      {profileCompletion < 100 && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
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
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
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
