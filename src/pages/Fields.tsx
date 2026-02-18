import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ListFilter as Filter, MapPin, X } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import type { Field } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const soilOptions = [
  {
    name: 'Sandy',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=60',
  },
  {
    name: 'Sandy Clay',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=60',
  },
  {
    name: 'Sandy Loam',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=60',
  },
  {
    name: 'Silt Loam',
    image: 'https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?auto=format&fit=crop&w=600&q=60',
  },
  {
    name: 'Heavy Clay',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=60',
  },
  {
    name: 'Silt Clay',
    image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=60',
  },
];

const orchardTypes = ['High Density', 'Medium Density', 'Traditional', 'All'];
const KANAL_SQM = 505.857;

type AppleVariety = {
  name: string;
  role: 'pollinator' | 'main' | 'both';
  description: string;
};

const traditionalVarieties: AppleVariety[] = [
  { name: 'Red Delicious / Delicious', role: 'both', description: '🌸 Pollinator + Main variety' },
  { name: 'American Apple', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Maharaji', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Ambri', role: 'both', description: '🌸 Pollinator + Main variety' },
  { name: 'Kashmir Golden / Golden Delicious', role: 'pollinator', description: '🌸 Excellent Pollinator' },
  { name: 'Hazratbali', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Razakwari / Chemora', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Kullu Delicious', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Kinnaur', role: 'main', description: '🌳 Main (needs pollinator)' },
];

const highDensityVarieties: AppleVariety[] = [
  { name: 'Jeromine', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'King Roat', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Gala Scarlet / Redlum Gala', role: 'both', description: '🌸 Pollinator + Main variety' },
  { name: 'Red Velox', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Scarlet Spur-II', role: 'pollinator', description: '🌸 Good Pollinator' },
  { name: 'Super Chief', role: 'both', description: '🌸 Pollinator + Main variety' },
  { name: 'Auvi Fuji', role: 'main', description: '🌳 Main (needs pollinator)' },
  { name: 'Pink Lady', role: 'main', description: '🌳 Main (needs pollinator)' },
];

type VarietyInRow = {
  variety: string;
  trees: string;
};

type OrchardRow = {
  rowId: string;
  varieties: VarietyInRow[];
};

type TreeTag = {
  id: string;
  name: string;
  variety: string;
  rowNumber: string;
  latitude: number;
  longitude: number;
};

type OrchardForm = {
  name: string;
  orchardType: string;
  areaKanal: string;
  ageYears: string;
  pollinatorType: string;
  rows: OrchardRow[];
  soilType: string;
  unknownSoil: boolean;
  pincode: string;
  district: string;
  tehsil: string;
  state: string;
  region: string;
  country: string;
  zone: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  boundaryPath: Array<{ lat: number; lng: number }>;
  mapAreaKanal?: number;
  treeTags: TreeTag[];
};

const createInitialForm = (): OrchardForm => ({
  name: '',
  orchardType: '',
  areaKanal: '',
  ageYears: '',
  pollinatorType: '',
  rows: [{ rowId: '1', varieties: [{ variety: '', trees: '' }] }],
  soilType: '',
  unknownSoil: false,
  pincode: '',
  district: '',
  tehsil: '',
  state: '',
  region: '',
  country: '',
  zone: '',
  fullAddress: '',
  latitude: undefined,
  longitude: undefined,
  boundaryPath: [],
  mapAreaKanal: undefined,
  treeTags: [],
});

const Fields = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [soilGuideOpen, setSoilGuideOpen] = useState(false);
  const [formData, setFormData] = useState<OrchardForm>(createInitialForm());
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [taggingMode, setTaggingMode] = useState(false);
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [pendingTagLocation, setPendingTagLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [tagFormData, setTagFormData] = useState({
    name: '',
    variety: '',
    rowNumber: '',
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const kmlLayerRef = useRef<any>(null);
  const kmlObjectUrlRef = useRef<string | null>(null);
  const kmlPolygonsRef = useRef<any[]>([]);
  const treeMarkersRef = useRef<any[]>([]);
  const taggingModeRef = useRef(false);
  const temporaryOutsideMarkersRef = useRef<any[]>([]);
  const boundaryPathRef = useRef<Array<{ lat: number; lng: number }>>([]);

  const apiKey =
    (import.meta.env.VITE_GOOGLE_API_KEY as string | undefined) || '';

  const varietyPalette = ['#22c55e', '#f97316', '#3b82f6', '#e11d48', '#a855f7', '#14b8a6'];

  const getVarietyColor = (variety: string) => {
    if (!variety) {
      return '#6b7280';
    }

    const hash = variety.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return varietyPalette[hash % varietyPalette.length];
  };

  const getAvailableVarieties = (): AppleVariety[] => {
    if (!formData.orchardType) {
      return [...traditionalVarieties, ...highDensityVarieties];
    }
    if (formData.orchardType === 'Traditional') {
      return traditionalVarieties;
    }
    if (formData.orchardType === 'High Density') {
      return highDensityVarieties;
    }
    return [...traditionalVarieties, ...highDensityVarieties];
  };

  const getPollinatorsForOrchard = (): AppleVariety[] => {
    return getAvailableVarieties().filter((v) => v.role === 'pollinator' || v.role === 'both');
  };

  // Utility function to check if a point is inside a polygon using ray casting algorithm
  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean => {
    if (!polygon || polygon.length < 3) return false;

    let inside = false;
    const x = point.lng;
    const y = point.lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-green-100 text-green-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'Poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFields = useMemo(() => {
    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fields, searchTerm]);

  useEffect(() => {
    if (formData.unknownSoil) {
      setFormData((prev) => ({ ...prev, soilType: 'Unknown' }));
    }
  }, [formData.unknownSoil]);

  useEffect(() => {
    taggingModeRef.current = taggingMode;
  }, [taggingMode]);

  useEffect(() => {
    boundaryPathRef.current = formData.boundaryPath || [];
  }, [formData.boundaryPath]);

  // When tagging mode is enabled, disable drawing mode to allow tree tagging
  useEffect(() => {
    if (taggingMode && drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [taggingMode]);

  useEffect(() => {
    const loadFields = async () => {
      if (!session?.user) {
        setFields([]);
        setFieldsLoading(false);
        return;
      }

      setFieldsLoading(true);
      setFieldsError(null);

      const { data, error } = await supabase
        .from('fields')
        .select(
          'id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details'
        )
        .eq('user_id', session.user.id);

      if (error) {
        setFieldsError(error.message);
        setFieldsLoading(false);
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
        details: row.details ?? undefined,
      }));

      setFields(mappedFields);
      setFieldsLoading(false);
    };

    loadFields();
  }, [session?.user]);

  useEffect(() => {
    if (formData.pincode.trim().length !== 6) {
      setPincodeError(null);
      return;
    }

    const controller = new AbortController();
    const loadDistrict = async () => {
      setPincodeLoading(true);
      setPincodeError(null);
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${formData.pincode}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        const postOffice = data?.[0]?.PostOffice?.[0];
        if (postOffice?.District) {
          setFormData((prev) => ({
            ...prev,
            district: postOffice.District ?? prev.district,
            state: postOffice.State ?? prev.state,
            country: postOffice.Country ?? prev.country,
            region: postOffice.Region ?? postOffice.Division ?? prev.region,
            tehsil: postOffice.Taluk ?? postOffice.Block ?? prev.tehsil,
            zone: postOffice.Circle ?? prev.zone,
          }));
        } else {
          setPincodeError('No district found for this pincode.');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPincodeError('Unable to fetch district.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setPincodeLoading(false);
        }
      }
    };

    loadDistrict();

    return () => controller.abort();
  }, [formData.pincode]);

  useEffect(() => {
    if (!wizardOpen || wizardStep !== 4 || mapsLoaded || mapsError) {
      return;
    }

    if (!apiKey) {
      setMapsError('Missing Google Maps API key.');
      return;
    }

    const existingScript = document.querySelector('script[data-google-maps]');
    if (existingScript) {
      if ((window as Window & { google?: any }).google?.maps) {
        setMapsLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => setMapsLoaded(true);
    script.onerror = () => setMapsError('Failed to load Google Maps.');
    document.head.appendChild(script);
  }, [apiKey, mapsError, mapsLoaded, wizardOpen, wizardStep]);

  useEffect(() => {
    if (!wizardOpen || wizardStep !== 4 || !mapsLoaded || !mapContainerRef.current) {
      return;
    }

    if (mapInstanceRef.current) {
      return;
    }

    const googleMaps = (window as Window & { google?: any }).google;
    if (!googleMaps?.maps) {
      return;
    }

    const center = {
      lat: formData.latitude ?? 31.5204,
      lng: formData.longitude ?? 74.3587,
    };

    const map = new googleMaps.maps.Map(mapContainerRef.current, {
      center,
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: googleMaps.maps.ControlPosition.TOP_LEFT,
        mapTypeIds: ['roadmap', 'satellite'],
      },
      streetViewControl: false,
    });

    mapInstanceRef.current = map;

    // Don't show a pinned marker - only boundary drawing allowed
    // Markers will only appear for trees during tagging mode

    // Store click handler function for cleanup if needed
    const handleMapClick = (event: any) => {
      try {
        const position = event?.latLng;
        if (!position) {
          return;
        }

        // Only process clicks in tagging mode
        if (!taggingModeRef.current) {
          return;
        }

        const clickedPoint = {
          lat: position.lat(),
          lng: position.lng(),
        };

        console.log('Click detected at:', clickedPoint);
        console.log('Tagging mode:', taggingModeRef.current);
        console.log('Boundary path:', boundaryPathRef.current.length > 0 ? 'exists' : 'empty');

        // If boundary exists, check if point is inside
        if (boundaryPathRef.current && boundaryPathRef.current.length > 0) {
          const isInside = isPointInPolygon(clickedPoint, boundaryPathRef.current);
          console.log('Point inside boundary:', isInside);

          if (!isInside) {
            // Show temporary red dot for outside click
            const googleMaps = (window as any).google;
            if (googleMaps?.maps && mapInstanceRef.current) {
              const tempMarker = new googleMaps.maps.Marker({
                position: clickedPoint,
                map: mapInstanceRef.current,
                title: 'Outside boundary - trees can only be tagged inside',
                icon: {
                  path: googleMaps.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#ff0000',
                  fillOpacity: 0.8,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                },
              });

              temporaryOutsideMarkersRef.current.push(tempMarker);

              // Remove marker after 2 seconds
              setTimeout(() => {
                tempMarker.setMap(null);
                temporaryOutsideMarkersRef.current = temporaryOutsideMarkersRef.current.filter(
                  (m) => m !== tempMarker
                );
              }, 2000);
            }
            return;
          }
        }

        // Point is inside boundary or no boundary exists - open tag form
        console.log('Opening tag form for point:', clickedPoint);
        setPendingTagLocation(clickedPoint);
        setTagFormOpen(true);
      } catch (error) {
        console.error('Error in map click handler:', error);
      }
    };

    map.addListener('click', handleMapClick);

    const drawingManager = new googleMaps.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: googleMaps.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon'],
      },
      polygonOptions: {
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        strokeColor: '#16a34a',
        strokeWeight: 2,
        editable: true,
      },
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Add Auto Detect Location custom control
    const autoDetectButton = document.createElement('button');
    autoDetectButton.textContent = 'Auto Detect';
    autoDetectButton.className = 'bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow-md border border-gray-300 cursor-pointer m-2.5';
    autoDetectButton.onclick = () => {
      if (!navigator.geolocation) {
        return;
      }
      navigator.geolocation.getCurrentPosition((position) => {
        // Auto detect just centers the map, doesn't set pinned location
        mapInstanceRef.current?.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        mapInstanceRef.current?.setZoom(13);
      });
    };
    map.controls[googleMaps.maps.ControlPosition.TOP_RIGHT].push(autoDetectButton);

    googleMaps.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
      if (event.type !== 'polygon') {
        return;
      }

      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }

      polygonRef.current = event.overlay;
      const path = event.overlay.getPath();
      const points = path.getArray().map((point: any) => ({
        lat: point.lat(),
        lng: point.lng(),
      }));

      const areaSqm = googleMaps.maps.geometry.spherical.computeArea(path);
      const areaKanal = areaSqm / KANAL_SQM;

      setFormData((prev) => ({
        ...prev,
        boundaryPath: points,
        mapAreaKanal: Number(areaKanal.toFixed(2)),
      }));

      // Don't add click listener to polygon - just close drawing mode
    });

    if (kmlObjectUrlRef.current) {
      if (kmlLayerRef.current) {
        kmlLayerRef.current.setMap(null);
      }

      kmlLayerRef.current = new googleMaps.maps.KmlLayer({
        url: kmlObjectUrlRef.current,
        map,
        preserveViewport: false,
      });
    }
  }, [formData.latitude, formData.longitude, mapsLoaded, wizardOpen, wizardStep]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    const googleMaps = (window as Window & { google?: any }).google;
    if (!googleMaps?.maps) {
      return;
    }

    treeMarkersRef.current.forEach((marker) => marker.setMap(null));
    treeMarkersRef.current = formData.treeTags.map((tag) => {
      const color = getVarietyColor(tag.variety);
      const isSelected = selectedTreeId === tag.id;
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
        (isSelected ? `<circle cx="32" cy="32" r="30" fill="#fbbf24" opacity="0.5"/>` : '') +
        `<circle cx="32" cy="24" r="18" fill="${color}" ${isSelected ? 'stroke="#fbbf24" stroke-width="3"' : ''}/>` +
        `<rect x="28" y="36" width="8" height="18" fill="#8b5a2b"/>` +
        `</svg>`;
      const marker = new googleMaps.maps.Marker({
        position: { lat: tag.latitude, lng: tag.longitude },
        map: mapInstanceRef.current,
        title: tag.name || 'Tree',
        icon: {
          url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
          scaledSize: new googleMaps.maps.Size(48, 48),
          anchor: new googleMaps.maps.Point(24, 48),
        },
      });

      // Add click listener to pan to tree location
      marker.addListener('click', () => {
        mapInstanceRef.current?.panTo({ lat: tag.latitude, lng: tag.longitude });
        mapInstanceRef.current?.setZoom(18);
        setSelectedTreeId(tag.id);
      });

      return marker;
    });
  }, [formData.treeTags, selectedTreeId]);

  useEffect(() => {
    if (!mapInstanceRef.current || !formData.latitude || !formData.longitude) {
      return;
    }

    const googleMaps = (window as Window & { google?: any }).google;
    if (!googleMaps?.maps) {
      return;
    }

    const position = new googleMaps.maps.LatLng(formData.latitude, formData.longitude);
    mapInstanceRef.current.panTo(position);
  }, [formData.latitude, formData.longitude]);


  const resetWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setSoilGuideOpen(false);
    setFormData(createInitialForm());
    setEditingFieldId(null);
    setPincodeError(null);
    setMapsError(null);
    setMapsLoaded(false);
    setTaggingMode(false);
    setTagFormOpen(false);
    setPendingTagLocation(null);
    setSelectedTreeId(null);
    setTagFormData({
      name: '',
      variety: '',
      rowNumber: '',
    });
    mapInstanceRef.current = null;
    markerRef.current = null;
    polygonRef.current = null;
    drawingManagerRef.current = null;
    if (kmlLayerRef.current) {
      kmlLayerRef.current.setMap(null);
      kmlLayerRef.current = null;
    }
    if (kmlObjectUrlRef.current) {
      URL.revokeObjectURL(kmlObjectUrlRef.current);
      kmlObjectUrlRef.current = null;
    }
    treeMarkersRef.current.forEach((marker) => marker.setMap(null));
    treeMarkersRef.current = [];
    temporaryOutsideMarkersRef.current.forEach((marker) => marker.setMap(null));
    temporaryOutsideMarkersRef.current = [];
    boundaryPathRef.current = [];
  };

  const openWizard = () => {
    setEditingFieldId(null);
    setWizardOpen(true);
    setWizardStep(1);
  };

  const populateFormForEdit = (field: Field) => {
    // If the field has details saved, prefer them to populate the form
    const details = (field as any).details ?? null;
    if (details) {
      // merge known top-level fields with details
      setFormData((prev) => ({ ...prev, ...(details as OrchardForm) }));
    } else {
      // fallback: map available top-level fields
      setFormData((prev) => ({
        ...prev,
        name: field.name || prev.name,
        areaKanal: field.area?.toString() ?? prev.areaKanal,
        latitude: field.latitude ?? prev.latitude,
        longitude: field.longitude ?? prev.longitude,
        boundaryPath: field.boundaryPath ?? prev.boundaryPath,
      }));
    }
  };

  const openWizardForEdit = (field: Field) => {
    setEditingFieldId(field.id);
    populateFormForEdit(field);
    setWizardOpen(true);
    setWizardStep(1);
  };

  const handleUpdateField = async () => {
    if (!session?.user || !editingFieldId) return;

    setFieldsError(null);

    // Calculate field coordinates from boundary center if boundary exists, otherwise keep existing
    let fieldLat = formData.latitude ?? 31.5204;
    let fieldLng = formData.longitude ?? 74.3587;
    
    if (formData.boundaryPath && formData.boundaryPath.length > 0) {
      const center = calculateBoundaryCenter(formData.boundaryPath);
      if (center) {
        fieldLat = center.lat;
        fieldLng = center.lng;
      }
    }

    const payload = {
      name: formData.name || 'Orchard',
      area: Number(formData.areaKanal) || 0,
      soil_type: formData.soilType || 'Unknown',
      crop_stage: 'Growing',
      health_status: 'Good',
      location: formData.district || formData.zone || 'Unknown',
      planted_date: new Date().toISOString().slice(0, 10),
      latitude: fieldLat,
      longitude: fieldLng,
      boundary_path: formData.boundaryPath.length > 0 ? formData.boundaryPath : null,
      details: formData,
    };

    const { data, error } = await supabase
      .from('fields')
      .update(payload)
      .eq('id', editingFieldId)
      .select('id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details')
      .single();

    if (error) {
      setFieldsError(error.message);
      return;
    }

    if (data) {
      const updated: Field = {
        id: data.id,
        name: data.name,
        area: data.area ?? 0,
        soilType: data.soil_type ?? 'Unknown',
        cropStage: data.crop_stage ?? 'Growing',
        healthStatus: data.health_status ?? 'Good',
        location: data.location ?? 'Unknown',
        plantedDate: data.planted_date ?? '',
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        boundaryPath: data.boundary_path ?? undefined,
        details: data.details ?? undefined,
      };

      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }

    resetWizard();
  };

  const updateFormValue = <K extends keyof OrchardForm>(key: K, value: OrchardForm[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearBoundary = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    setFormData((prev) => ({ ...prev, boundaryPath: [], mapAreaKanal: undefined }));
  };

  const handleMapAreaSave = () => {
    if (!formData.mapAreaKanal) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      areaKanal: prev.mapAreaKanal?.toString() ?? prev.areaKanal,
    }));
  };

  const handleCreateField = async () => {
    if (!session?.user) {
      return;
    }

    setFieldsError(null);

    // Calculate field coordinates from boundary center if boundary exists, otherwise use default
    let fieldLat = 31.5204;
    let fieldLng = 74.3587;
    
    if (formData.boundaryPath && formData.boundaryPath.length > 0) {
      const center = calculateBoundaryCenter(formData.boundaryPath);
      if (center) {
        fieldLat = center.lat;
        fieldLng = center.lng;
      }
    }

    const payload = {
      user_id: session.user.id,
      name: formData.name || 'New Orchard',
      area: Number(formData.areaKanal) || 0,
      soil_type: formData.soilType || 'Unknown',
      crop_stage: 'Growing',
      health_status: 'Good',
      location: formData.district || formData.zone || 'Unknown',
      planted_date: new Date().toISOString().slice(0, 10),
      latitude: fieldLat,
      longitude: fieldLng,
      boundary_path: formData.boundaryPath.length > 0 ? formData.boundaryPath : null,
      details: formData,
    };

    const { data, error } = await supabase
      .from('fields')
      .insert(payload)
      .select(
        'id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details'
      )
      .single();

    if (error) {
      setFieldsError(error.message);
      return;
    }

    if (data) {
      const newField: Field = {
        id: data.id,
        name: data.name,
        area: data.area ?? 0,
        soilType: data.soil_type ?? 'Unknown',
        cropStage: data.crop_stage ?? 'Growing',
        healthStatus: data.health_status ?? 'Good',
        location: data.location ?? 'Unknown',
        plantedDate: data.planted_date ?? '',
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        boundaryPath: data.boundary_path ?? undefined,
      };

      setFields((prev) => [newField, ...prev]);
    }

    resetWizard();
  };

  const handleViewOnMap = (field: Field) => {
    navigate('/dashboard', { state: { focusFieldId: field.id } });
  };

  const handleGoToTree = (tag: TreeTag) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: tag.latitude, lng: tag.longitude });
      mapInstanceRef.current.setZoom(18);
      setSelectedTreeId(tag.id);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Delete this field? This action cannot be undone.')) return;
    if (!session?.user) return;

    setFieldsError(null);

    const { error } = await supabase.from('fields').delete().eq('id', fieldId);

    if (error) {
      setFieldsError(error.message);
      return;
    }

    setFields((prev) => prev.filter((f) => f.id !== fieldId));

    if (editingFieldId === fieldId) {
      resetWizard();
    }
  };

  // Row management handlers
  const handleAddRow = () => {
    const nextRowId = String(formData.rows.length + 1);
    setFormData((prev) => ({
      ...prev,
      rows: [...prev.rows, { rowId: nextRowId, varieties: [{ variety: '', trees: '' }] }],
    }));
  };

  const handleRemoveRow = (rowIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, idx) => idx !== rowIndex),
    }));
  };

  const handleAddVarietyToRow = (rowIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, idx) =>
        idx === rowIndex
          ? { ...row, varieties: [...row.varieties, { variety: '', trees: '' }] }
          : row
      ),
    }));
  };

  const handleRemoveVarietyFromRow = (rowIndex: number, varietyIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, idx) =>
        idx === rowIndex
          ? { ...row, varieties: row.varieties.filter((_, vIdx) => vIdx !== varietyIndex) }
          : row
      ),
    }));
  };

  const handleRowVarietyChange = (rowIndex: number, varietyIndex: number, field: 'variety' | 'trees', value: string) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, rIdx) =>
        rIdx === rowIndex
          ? {
              ...row,
              varieties: row.varieties.map((v, vIdx) =>
                vIdx === varietyIndex ? { ...v, [field]: value } : v
              ),
            }
          : row
      ),
    }));
  };

  const handleTagFormSubmit = () => {
    if (!pendingTagLocation) {
      return;
    }

    const newTag: TreeTag = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      name: tagFormData.name.trim(),
      variety: tagFormData.variety.trim(),
      rowNumber: tagFormData.rowNumber.trim(),
      latitude: pendingTagLocation.lat,
      longitude: pendingTagLocation.lng,
    };

    setFormData((prev) => ({
      ...prev,
      treeTags: [...prev.treeTags, newTag],
    }));

    setTagFormOpen(false);
    setPendingTagLocation(null);
    setTagFormData({
      name: '',
      variety: '',
      rowNumber: '',
    });
  };

  const calculateBoundaryCenter = (boundaryPath: Array<{ lat: number; lng: number }>): { lat: number; lng: number } | null => {
    if (!boundaryPath || boundaryPath.length === 0) return null;
    
    let lat = 0, lng = 0;
    boundaryPath.forEach(point => {
      lat += point.lat;
      lng += point.lng;
    });
    
    return {
      lat: lat / boundaryPath.length,
      lng: lng / boundaryPath.length,
    };
  };

  const handleRemoveTreeTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      treeTags: prev.treeTags.filter((tag) => tag.id !== tagId),
    }));
  };

  const handleKmlUpload = (file?: File | null) => {
    if (!file) {
      return;
    }
    (async () => {
      try {
        const text = await file.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        // remove previous KML polygons
        if (kmlPolygonsRef.current.length) {
          kmlPolygonsRef.current.forEach((p) => p.setMap(null));
          kmlPolygonsRef.current = [];
        }

        const googleMaps = (window as Window & { google?: any }).google;
        if (!googleMaps?.maps || !mapInstanceRef.current) {
          return;
        }

        const placemarks = Array.from(xml.getElementsByTagName('Placemark'));
        const parsedPolygons: Array<Array<{ lat: number; lng: number }>> = [];

        placemarks.forEach((pm) => {
          const polygons = Array.from(pm.getElementsByTagName('Polygon'));
          polygons.forEach((poly) => {
            const coordsElems = Array.from(poly.getElementsByTagName('coordinates'));
            coordsElems.forEach((coordsElem) => {
              const coordsText = coordsElem.textContent || '';
              const coords = coordsText
                .trim()
                .split(/\s+/)
                .map((c) => c.split(',').map((v) => v.trim()))
                .filter((parts) => parts.length >= 2)
                .map((parts) => ({ lat: Number(parts[1]), lng: Number(parts[0]) }));

              if (coords.length) parsedPolygons.push(coords);
            });
          });
        });

        // Also support simple Polygon elements under Document
        if (parsedPolygons.length === 0) {
          const polygons = Array.from(xml.getElementsByTagName('Polygon'));
          polygons.forEach((poly) => {
            const coordsElems = Array.from(poly.getElementsByTagName('coordinates'));
            coordsElems.forEach((coordsElem) => {
              const coordsText = coordsElem.textContent || '';
              const coords = coordsText
                .trim()
                .split(/\s+/)
                .map((c) => c.split(',').map((v) => v.trim()))
                .filter((parts) => parts.length >= 2)
                .map((parts) => ({ lat: Number(parts[1]), lng: Number(parts[0]) }));
              if (coords.length) parsedPolygons.push(coords);
            });
          });
        }

        // Render parsed polygons on the map
        parsedPolygons.forEach((pts) => {
          const polygon = new googleMaps.maps.Polygon({
            paths: pts,
            strokeColor: '#16a34a',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: '#a7f3d0',
            fillOpacity: 0.35,
          });
          polygon.setMap(mapInstanceRef.current);
          kmlPolygonsRef.current.push(polygon);
        });

        // If we have at least one polygon, set it as boundaryPath and compute area
        if (parsedPolygons.length > 0) {
          const first = parsedPolygons[0];
          const pathLatLng = first.map((pt) => new googleMaps.maps.LatLng(pt.lat, pt.lng));
          let areaKanal: number | undefined = undefined;
          try {
            const areaSqm = googleMaps.maps.geometry.spherical.computeArea(pathLatLng as any);
            areaKanal = areaSqm / KANAL_SQM;
          } catch (e) {
            // ignore if geometry library not available
          }

          setFormData((prev) => ({
            ...prev,
            boundaryPath: first,
            mapAreaKanal: areaKanal ? Number(areaKanal.toFixed(2)) : prev.mapAreaKanal,
          }));

          // Fit map to polygon bounds
          const bounds = new googleMaps.maps.LatLngBounds();
          first.forEach((pt) => bounds.extend({ lat: pt.lat, lng: pt.lng } as any));
          try { mapInstanceRef.current.fitBounds(bounds); } catch (e) { /* ignore */ }
        }
      } catch (error) {
        console.error('Failed to parse KML', error);
      }
    })();
  };

  // Calculate summary statistics
  const getRowSummary = () => {
    const varietyTotals = new Map<string, number>();
    let totalTrees = 0;

    formData.rows.forEach((row) => {
      row.varieties.forEach((v) => {
        if (v.variety) {
          const count = Number(v.trees) || 0;
          varietyTotals.set(v.variety, (varietyTotals.get(v.variety) || 0) + count);
          totalTrees += count;
        }
      });
    });

    return { varietyTotals, totalTrees };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Orchards</h1>
        <Button className="flex items-center space-x-2" onClick={openWizard}>
          <Plus className="w-4 h-4" />
          <span>Create Field</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
        </div>
      </Card>

      {fieldsError && (
        <Card className="p-4 border border-red-200 bg-red-50 text-sm text-red-700">
          {fieldsError}
        </Card>
      )}

      {/* Fields Grid */}
      {fieldsLoading ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-gray-500">Loading fields...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => (
            <Card key={field.id} className="p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{field.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {field.location}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(field.healthStatus)}`}>
                  {field.healthStatus}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Area (kanal):</span>
                  <span className="text-sm font-medium text-gray-900">{field.area}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Soil Type:</span>
                  <span className="text-sm font-medium text-gray-900">{field.soilType}</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewOnMap(field)}
                >
                  View on Map
                </Button>
                <Button size="sm" className="flex-1" onClick={() => openWizardForEdit(field)}>
                  Edit Field
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDeleteField(field.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!fieldsLoading && filteredFields.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No fields found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first field.'}
          </p>
          <Button onClick={openWizard}>Create Field</Button>
        </Card>
      )}

      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={resetWizard} />
          <div className="relative bg-white w-full max-w-5xl mx-4 rounded-2xl shadow-xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Field Creation</h2>
                <p className="text-sm text-gray-500">Step {wizardStep} of 4</p>
              </div>
              <button
                type="button"
                onClick={resetWizard}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Orchard Details', 'Soil Type', 'Location', 'Orchard Map'].map((label, index) => (
                  <div
                    key={label}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      wizardStep === index + 1
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}. {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-1">
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orchard Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateFormValue('name', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orchard Type</label>
                      <select
                        value={formData.orchardType}
                        onChange={(e) => updateFormValue('orchardType', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        {orchardTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orchard Area (kanal)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.areaKanal}
                        onChange={(e) => updateFormValue('areaKanal', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age of Orchard (years)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.ageYears}
                        onChange={(e) => updateFormValue('ageYears', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pollinator Type</label>
                      <select
                        value={formData.pollinatorType}
                        onChange={(e) => updateFormValue('pollinatorType', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select pollinator variety</option>
                        {getPollinatorsForOrchard().map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} - {v.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Row Configuration</h3>
                      <Button variant="outline" size="sm" onClick={handleAddRow}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Row
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {formData.rows.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Row {row.rowId}</h4>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddVarietyToRow(rowIndex)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Variety
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveRow(rowIndex)}
                                disabled={formData.rows.length === 1}
                                className="text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {row.varieties.map((varietyInRow, varietyIndex) => (
                              <div key={`row-${rowIndex}-variety-${varietyIndex}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end bg-white p-3 rounded border border-gray-200">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Variety</label>
                                  <select
                                    value={varietyInRow.variety}
                                    onChange={(e) => handleRowVarietyChange(rowIndex, varietyIndex, 'variety', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                  >
                                    <option value="">Select variety</option>
                                    {getAvailableVarieties().map((v) => (
                                      <option key={v.name} value={v.name}>
                                        {v.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Trees</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Number"
                                    value={varietyInRow.trees}
                                    onChange={(e) => handleRowVarietyChange(rowIndex, varietyIndex, 'trees', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveVarietyFromRow(rowIndex, varietyIndex)}
                                  disabled={row.varieties.length === 1}
                                  className="mb-1"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Row subtotal */}
                          <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between text-sm">
                            <span className="font-medium text-gray-700">Row {row.rowId} Total:</span>
                            <span className="font-semibold text-green-700">
                              {row.varieties.reduce((sum, v) => sum + (Number(v.trees) || 0), 0)} trees
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall Summary */}
                    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">Orchard Summary</h3>

                      {/* Variety breakdown */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700 mb-2">Variety Breakdown:</p>
                        {(() => {
                          const { varietyTotals } = getRowSummary();

                          if (varietyTotals.size === 0) {
                            return <p className="text-xs text-gray-600">Add varieties to see breakdown</p>;
                          }

                          return Array.from(varietyTotals.entries()).map(([variety, count]) => (
                            <div key={variety} className="flex justify-between text-sm text-gray-700 py-1 border-b border-green-200 last:border-b-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-3 w-3 rounded-full"
                                  style={{ backgroundColor: getVarietyColor(variety) }}
                                />
                                <span>{variety}</span>
                              </div>
                              <span className="font-medium">{count} trees</span>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Net total */}
                      <div className="pt-2 border-t-2 border-green-300 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Net Total Trees:</span>
                        <span className="text-lg font-bold text-green-700">
                          {getRowSummary().totalTrees}
                        </span>
                      </div>

                      {/* Row count */}
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Total Rows:</span>
                        <span className="font-medium">{formData.rows.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Select Soil Type</h3>
                    <button
                      type="button"
                      className="text-sm font-medium text-green-700 hover:text-green-800"
                      onClick={() => setSoilGuideOpen(true)}
                    >
                      Check Soil Guide
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {soilOptions.map((soil) => (
                      <button
                        key={soil.name}
                        type="button"
                        onClick={() => {
                          if (formData.unknownSoil) {
                            return;
                          }
                          updateFormValue('soilType', soil.name);
                        }}
                        className={`rounded-xl border overflow-hidden text-left transition ${
                          formData.soilType === soil.name
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-300'
                        } ${formData.unknownSoil ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <img src={soil.image} alt={soil.name} className="h-28 w-full object-cover" />
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-800">{soil.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.unknownSoil}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          unknownSoil: e.target.checked,
                          soilType: e.target.checked ? 'Unknown' : '',
                        }))
                      }
                      className="h-4 w-4 text-green-600 border-gray-300 rounded"
                    />
                    Can't determine soil type
                  </label>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => updateFormValue('pincode', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      {pincodeLoading && <p className="text-xs text-gray-500 mt-1">Fetching location...</p>}
                      {pincodeError && <p className="text-xs text-red-500 mt-1">{pincodeError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => updateFormValue('district', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tehsil</label>
                      <input
                        type="text"
                        value={formData.tehsil}
                        onChange={(e) => updateFormValue('tehsil', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => updateFormValue('region', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => updateFormValue('state', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                      <input
                        type="text"
                        value={formData.zone}
                        onChange={(e) => updateFormValue('zone', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => updateFormValue('country', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea
                      rows={3}
                      value={formData.fullAddress}
                      onChange={(e) => updateFormValue('fullAddress', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Orchard Map</h3>
                      <p className="text-sm text-gray-500">Pin the location, draw boundary, and tag individual trees.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={taggingMode ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setTaggingMode((prev) => !prev)}
                      >
                        {taggingMode ? 'Tagging On ✓' : 'Tag Trees'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearBoundary}>
                        Clear Boundary
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleMapAreaSave}>
                        Save Map Area
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload KML File</label>
                      <input
                        type="file"
                        accept=".kml,application/vnd.google-earth.kml+xml"
                        onChange={(e) => handleKmlUpload(e.target.files?.[0])}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload KML to auto-load boundary and calculate area.
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Tree Tags</p>
                      <p className="text-lg font-semibold text-gray-900">{formData.treeTags.length} tagged</p>
                      {formData.treeTags.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {[...new Set(formData.treeTags.map((tag) => tag.variety).filter(Boolean))].map((variety) => (
                            <div key={variety} className="flex items-center gap-2 text-xs text-gray-700">
                              <span
                                className="inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: getVarietyColor(variety) }}
                              />
                              {variety}: {formData.treeTags.filter(t => t.variety === variety).length}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {mapsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {mapsError} Add VITE_GOOGLE_API_KEY to your environment.
                    </div>
                  ) : (
                    <div
                      ref={mapContainerRef}
                      className="h-96 w-full rounded-lg border border-gray-200 bg-gray-50"
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Pinned Location</p>
                      <p className="text-sm text-gray-800">
                        {formData.latitude && formData.longitude
                          ? `${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}`
                          : 'Click map or use Auto Detect'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Boundary Points</p>
                      <p className="text-sm text-gray-800">
                        {formData.boundaryPath.length ? `${formData.boundaryPath.length} points` : 'Draw or upload KML'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Calculated Area (kanal)</p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {formData.mapAreaKanal ? formData.mapAreaKanal : 'Draw boundary first'}
                      </p>
                    </div>
                  </div>

                  {formData.boundaryPath.length > 0 && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-green-900 mb-1">Boundary Saved Successfully</h4>
                          <p className="text-xs text-green-700">
                            {formData.boundaryPath.length} points covering {formData.mapAreaKanal || '?'} kanal.
                            Click "Save Map Area" to update the orchard area field.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.treeTags.length > 0 && (
                    <div className="rounded-lg border border-gray-200 p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Tagged Trees ({formData.treeTags.length})</h4>
                        <p className="text-xs text-gray-500">
                          {selectedTreeId ? '✨ Tree selected' : 'Click a tree to highlight it'}
                        </p>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {formData.treeTags.map((tag) => (
                          <div
                            key={tag.id}
                            className={`flex items-center justify-between text-sm text-gray-700 p-2 rounded cursor-pointer transition-colors ${
                              selectedTreeId === tag.id
                                ? 'bg-yellow-100 border-2 border-yellow-400'
                                : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                            onClick={() => handleGoToTree(tag)}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: getVarietyColor(tag.variety) }}
                              />
                              <span className="font-medium">{tag.name || 'Unnamed'}</span>
                              {tag.variety && <span className="text-xs text-gray-500">({tag.variety})</span>}
                              {tag.rowNumber && <span className="text-xs bg-green-100 px-2 py-0.5 rounded">Row {tag.rowNumber}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTreeTag(tag.id);
                              }}
                              className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                disabled={wizardStep === 1}
              >
                Back
              </Button>
              {wizardStep < 4 ? (
                <Button onClick={() => setWizardStep((prev) => Math.min(4, prev + 1))}>Next</Button>
              ) : (
                <Button onClick={editingFieldId ? handleUpdateField : handleCreateField}>
                  {editingFieldId ? 'Save Changes' : 'Create Field'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {soilGuideOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSoilGuideOpen(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Soil Guide</h3>
              <button
                type="button"
                onClick={() => setSoilGuideOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Use texture and moisture to identify soil type. Sandy soils feel gritty, while clay soils feel sticky.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>Sandy: Loose, fast-draining, low moisture retention.</li>
              <li>Sandy Loam: Balanced texture, good drainage and nutrients.</li>
              <li>Silt Loam: Smooth, holds moisture, fertile.</li>
              <li>Clay: Dense, holds water, slow drainage.</li>
            </ul>
          </div>
        </div>
      )}

      {tagFormOpen && pendingTagLocation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTagFormOpen(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tag Tree</h3>
              <button
                type="button"
                onClick={() => setTagFormOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tree Name</label>
                <input
                  type="text"
                  value={tagFormData.name}
                  onChange={(e) => setTagFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Tree-A1, Main-1, etc."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                <select
                  value={tagFormData.variety}
                  onChange={(e) => setTagFormData((prev) => ({ ...prev, variety: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select variety</option>
                  {getAvailableVarieties().map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {tagFormData.variety && (() => {
                  const selectedVariety = getAvailableVarieties().find((v) => v.name === tagFormData.variety);
                  return selectedVariety ? (
                    <p className="text-xs text-gray-600 mt-1">{selectedVariety.description}</p>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Row Number</label>
                <select
                  value={tagFormData.rowNumber}
                  onChange={(e) => setTagFormData((prev) => ({ ...prev, rowNumber: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select row</option>
                  {formData.rows.map((row) => (
                    <option key={row.rowId} value={row.rowId}>
                      Row {row.rowId}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Link this tree to a specific row in your orchard</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setTagFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTagFormSubmit}>Save Tag</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fields;
