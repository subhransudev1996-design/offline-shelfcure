import 'package:flutter/material.dart';

import 'demo.dart';

/// A single follow-up activity logged against a lead.
class Followup {
  final String id;
  final String type;
  final String? notes;
  final String? outcome;
  final String? nextFollowupDate;
  final DateTime createdAt;

  Followup({
    required this.id,
    required this.type,
    this.notes,
    this.outcome,
    this.nextFollowupDate,
    required this.createdAt,
  });

  factory Followup.fromJson(Map<String, dynamic> j) => Followup(
        id: j['id'] as String,
        type: (j['type'] ?? 'call') as String,
        notes: j['notes'] as String?,
        outcome: j['outcome'] as String?,
        nextFollowupDate: j['next_followup_date'] as String?,
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

/// A pharmacy lead. Mirrors the `leads` table (read-only in Phase 3).
class Lead {
  final String id;
  final String ownerName;
  final String? pharmacyName;
  final String? phone;
  final String? whatsappNumber;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String source;
  final String status;
  final String? notes;
  final int priorityScore;
  final double? gpsLat;
  final double? gpsLng;
  final String? convertedLicenseKey;
  final DateTime updatedAt;
  final List<Followup> followups;
  final List<Demo> demos;
  final Trial? trial;

  Lead({
    required this.id,
    required this.ownerName,
    this.pharmacyName,
    this.phone,
    this.whatsappNumber,
    this.email,
    this.address,
    this.city,
    this.state,
    required this.source,
    required this.status,
    this.notes,
    required this.priorityScore,
    this.gpsLat,
    this.gpsLng,
    this.convertedLicenseKey,
    required this.updatedAt,
    required this.followups,
    required this.demos,
    this.trial,
  });

  factory Lead.fromJson(Map<String, dynamic> j) {
    final trialList = (j['lead_trials'] as List?) ?? const [];
    return Lead(
      id: j['id'] as String,
      ownerName: (j['owner_name'] ?? '') as String,
      pharmacyName: j['pharmacy_name'] as String?,
      phone: j['phone'] as String?,
      whatsappNumber: j['whatsapp_number'] as String?,
      email: j['email'] as String?,
      address: j['address'] as String?,
      city: j['city'] as String?,
      state: j['state'] as String?,
      source: (j['source'] ?? 'cold_call') as String,
      status: (j['status'] ?? 'new') as String,
      notes: j['notes'] as String?,
      priorityScore: (j['priority_score'] ?? 0) as int,
      gpsLat: (j['gps_lat'] as num?)?.toDouble(),
      gpsLng: (j['gps_lng'] as num?)?.toDouble(),
      convertedLicenseKey: j['converted_license_key'] as String?,
      updatedAt: DateTime.parse(j['updated_at'] as String),
      followups: ((j['lead_followups'] as List?) ?? [])
          .map((f) => Followup.fromJson(f as Map<String, dynamic>))
          .toList(),
      demos: ((j['lead_demos'] as List?) ?? [])
          .map((d) => Demo.fromJson(d as Map<String, dynamic>))
          .toList(),
      trial: trialList.isEmpty
          ? null
          : Trial.fromJson(trialList.first as Map<String, dynamic>),
    );
  }

  String get displayName => pharmacyName?.isNotEmpty == true ? pharmacyName! : ownerName;
}

/// Status value → human label + pill color. Mirrors lib/leads/constants.ts.
class LeadStatus {
  static const Map<String, String> _labels = {
    'new': 'New',
    'contacted': 'Contacted',
    'followup_pending': 'Follow-up Pending',
    'call_not_picked': 'Call Not Picked',
    'interested': 'Interested',
    'visit_planned': 'Visit Planned',
    'demo_scheduled': 'Demo Scheduled',
    'demo_done': 'Demo Done',
    'trial_activated': 'Trial Activated',
    'negotiating': 'Negotiating',
    'payment_pending': 'Payment Pending',
    'future_opportunity': 'Future Opportunity',
    'converted': 'Converted',
    'lost': 'Lost',
  };

  static const Map<String, Color> _colors = {
    'new': Color(0xFF64748B),
    'contacted': Color(0xFF2563EB),
    'followup_pending': Color(0xFF0284C7),
    'call_not_picked': Color(0xFF71717A),
    'interested': Color(0xFFB45309),
    'visit_planned': Color(0xFF0D9488),
    'demo_scheduled': Color(0xFF4F46E5),
    'demo_done': Color(0xFF7E22CE),
    'trial_activated': Color(0xFF0891B2),
    'negotiating': Color(0xFFEA580C),
    'payment_pending': Color(0xFFA16207),
    'future_opportunity': Color(0xFF78716C),
    'converted': Color(0xFF059669),
    'lost': Color(0xFFEF4444),
  };

  static String label(String v) => _labels[v] ?? v;
  static Color color(String v) => _colors[v] ?? const Color(0xFF64748B);
}
