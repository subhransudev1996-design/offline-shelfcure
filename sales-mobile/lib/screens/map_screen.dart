import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../models/lead.dart';
import '../services/location_service.dart';
import '../services/sales_api.dart';
import 'lead_detail_screen.dart';

/// Map of all assigned pharmacy leads with GPS pins.
/// Marker colour mirrors the PRD §8 colour scheme.
class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _ctrl;
  final Map<String, Lead> _byId = {};
  Set<Marker> _markers = {};
  LatLng? _myLocation;
  bool _loading = true;
  String? _error;

  // Status → Google Maps marker hue (PRD §8: green/yellow/blue/orange/red/gray).
  static const Map<String, double> _hue = {
    'converted': BitmapDescriptor.hueGreen,
    'interested': BitmapDescriptor.hueYellow,
    'trial_activated': BitmapDescriptor.hueCyan,
    'demo_scheduled': BitmapDescriptor.hueAzure,
    'visit_planned': BitmapDescriptor.hueAzure,
    'demo_done': BitmapDescriptor.hueViolet,
    'followup_pending': BitmapDescriptor.hueOrange,
    'negotiating': BitmapDescriptor.hueOrange,
    'payment_pending': BitmapDescriptor.hueOrange,
    'lost': BitmapDescriptor.hueRed,
    'call_not_picked': BitmapDescriptor.hueRose,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Get GPS in parallel with the lead list. Failing location is OK.
      final results = await Future.wait([
        SalesApi.getLeads(),
        LocationService.currentPosition().then<dynamic>((p) => p).catchError((_) => null),
      ]);
      final leads = results[0] as List<Lead>;
      final pos = results[1];
      if (pos != null) {
        _myLocation = LatLng(pos.latitude as double, pos.longitude as double);
      }

      _byId
        ..clear()
        ..addEntries(leads.map((l) => MapEntry(l.id, l)));

      _markers = leads
          .where((l) => l.gpsLat != null && l.gpsLng != null)
          .map(_markerFor)
          .toSet();

      setState(() {});
      _fitCamera();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not load the map.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Marker _markerFor(Lead l) {
    final hue = _hue[l.status] ?? BitmapDescriptor.hueAzure;
    return Marker(
      markerId: MarkerId(l.id),
      position: LatLng(l.gpsLat!, l.gpsLng!),
      icon: BitmapDescriptor.defaultMarkerWithHue(hue),
      infoWindow: InfoWindow(
        title: l.displayName,
        snippet: '${LeadStatus.label(l.status)} · tap for details',
        onTap: () => _openLead(l),
      ),
    );
  }

  void _openLead(Lead l) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => LeadDetailScreen(lead: l)),
    );
  }

  void _fitCamera() {
    final ctrl = _ctrl;
    if (ctrl == null) return;
    final pts = _markers.map((m) => m.position).toList();
    if (_myLocation != null) pts.add(_myLocation!);
    if (pts.isEmpty) return;

    if (pts.length == 1) {
      ctrl.animateCamera(CameraUpdate.newLatLngZoom(pts.first, 14));
      return;
    }
    final south = pts.map((p) => p.latitude).reduce((a, b) => a < b ? a : b);
    final north = pts.map((p) => p.latitude).reduce((a, b) => a > b ? a : b);
    final west = pts.map((p) => p.longitude).reduce((a, b) => a < b ? a : b);
    final east = pts.map((p) => p.longitude).reduce((a, b) => a > b ? a : b);
    ctrl.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(south, west),
          northeast: LatLng(north, east),
        ),
        60,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Map'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        color: Color(0xFFDC2626), size: 40),
                    const SizedBox(height: 10),
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 14),
                    ElevatedButton(
                        onPressed: _load, child: const Text('Retry')),
                  ],
                ),
              ),
            )
          : Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: _myLocation ?? const LatLng(20.2961, 85.8245),
                    zoom: 11,
                  ),
                  myLocationEnabled: _myLocation != null,
                  myLocationButtonEnabled: true,
                  markers: _markers,
                  onMapCreated: (c) {
                    _ctrl = c;
                    _fitCamera();
                  },
                ),
                if (_loading)
                  const Positioned(
                    top: 12,
                    left: 12,
                    child: _LoadingChip(),
                  ),
                if (!_loading && _markers.isEmpty)
                  Positioned(
                    bottom: 24,
                    left: 24,
                    right: 24,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: const Text(
                        'No leads with GPS pins yet. Pins are saved automatically the first time you check in to a pharmacy.',
                        style: TextStyle(fontSize: 13),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

class _LoadingChip extends StatelessWidget {
  const _LoadingChip();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.10),
            blurRadius: 10,
          ),
        ],
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2)),
          SizedBox(width: 8),
          Text('Loading…', style: TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
