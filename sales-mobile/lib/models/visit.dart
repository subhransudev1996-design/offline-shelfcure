/// An in-progress visit returned by /api/sales/visits/active.
class ActiveVisit {
  final String id;
  final String leadId;
  final String leadName;
  final DateTime checkInAt;

  ActiveVisit({
    required this.id,
    required this.leadId,
    required this.leadName,
    required this.checkInAt,
  });

  factory ActiveVisit.fromJson(Map<String, dynamic> j) => ActiveVisit(
        id: j['id'] as String,
        leadId: j['lead_id'] as String,
        leadName: (j['lead_name'] ?? 'Lead') as String,
        checkInAt: DateTime.parse(j['check_in_at'] as String),
      );
}

/// Result of a successful POST /api/sales/visits/check-in.
class CheckInResult {
  final String visitId;
  final String leadId;
  final DateTime checkInAt;
  final int? distanceFromPinM;
  final bool? withinRadius;

  CheckInResult({
    required this.visitId,
    required this.leadId,
    required this.checkInAt,
    this.distanceFromPinM,
    this.withinRadius,
  });

  factory CheckInResult.fromJson(Map<String, dynamic> j) => CheckInResult(
        visitId: j['id'] as String,
        leadId: j['lead_id'] as String,
        checkInAt: DateTime.parse(j['check_in_at'] as String),
        distanceFromPinM: (j['distance_from_pin_m'] as num?)?.round(),
        withinRadius: j['within_radius'] as bool?,
      );
}

/// A nearby-leads row.
class NearbyLead {
  final String id;
  final String ownerName;
  final String? pharmacyName;
  final String? phone;
  final String? city;
  final String status;
  final double gpsLat;
  final double gpsLng;
  final int distanceM;

  NearbyLead({
    required this.id,
    required this.ownerName,
    this.pharmacyName,
    this.phone,
    this.city,
    required this.status,
    required this.gpsLat,
    required this.gpsLng,
    required this.distanceM,
  });

  factory NearbyLead.fromJson(Map<String, dynamic> j) => NearbyLead(
        id: j['id'] as String,
        ownerName: (j['owner_name'] ?? '') as String,
        pharmacyName: j['pharmacy_name'] as String?,
        phone: j['phone'] as String?,
        city: j['city'] as String?,
        status: (j['status'] ?? 'new') as String,
        gpsLat: (j['gps_lat'] as num).toDouble(),
        gpsLng: (j['gps_lng'] as num).toDouble(),
        distanceM: (j['distance_m'] as num).toInt(),
      );

  String get displayName =>
      pharmacyName?.isNotEmpty == true ? pharmacyName! : ownerName;
}
