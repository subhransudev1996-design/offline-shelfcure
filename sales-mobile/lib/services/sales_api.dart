import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../models/app_notification.dart';
import '../models/demo.dart';
import '../models/employee.dart';
import '../models/lead.dart';
import '../models/profile.dart';
import '../models/timeline.dart';
import '../models/visit.dart';

/// Thrown when a /api/sales/* call fails. `message` is safe to show the user.
class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, {this.status});
  @override
  String toString() => message;
}

/// Client for the ShelfCure /api/sales/* backend. Every request carries the
/// current Supabase session JWT as a Bearer token.
class SalesApi {
  static String? get _token =>
      Supabase.instance.client.auth.currentSession?.accessToken;

  static Map<String, String> get _headers {
    final t = _token;
    if (t == null) throw ApiException('Not signed in', status: 401);
    return {
      'Authorization': 'Bearer $t',
      'Content-Type': 'application/json',
    };
  }

  static Future<dynamic> _request(
    String method,
    String path, {
    Object? body,
  }) async {
    final url = Uri.parse('${AppConfig.apiBase}$path');
    final http.Response res;
    try {
      final fut = method == 'GET'
          ? http.get(url, headers: _headers)
          : http.post(url, headers: _headers, body: jsonEncode(body ?? {}));
      res = await fut.timeout(const Duration(seconds: 20));
    } catch (_) {
      throw ApiException('Network error — check your connection.');
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(res.body);
    } catch (_) {
      decoded = null;
    }

    if (res.statusCode >= 200 && res.statusCode < 300) return decoded;

    final msg = (decoded is Map && decoded['error'] is String)
        ? decoded['error'] as String
        : 'Request failed (${res.statusCode})';
    throw ApiException(msg, status: res.statusCode);
  }

  static Future<dynamic> _get(String path) => _request('GET', path);
  static Future<dynamic> _post(String path, Object body) =>
      _request('POST', path, body: body);

  /// Resolve the signed-in employee's profile + role.
  static Future<SalesProfile> getProfile() async {
    final json = await _get('/api/sales/auth/me');
    return SalesProfile.fromJson(json['profile'] as Map<String, dynamic>);
  }

  /// Leads visible to the signed-in employee (assigned to them).
  static Future<List<Lead>> getLeads() async {
    final json = await _get('/api/sales/leads');
    return ((json['leads'] as List?) ?? [])
        .map((l) => Lead.fromJson(l as Map<String, dynamic>))
        .toList();
  }

  // ── Visits ─────────────────────────────────────────────────────────────

  /// The caller's currently-open visit, if any (else `null`).
  static Future<ActiveVisit?> getActiveVisit() async {
    final json = await _get('/api/sales/visits/active');
    final v = json['visit'];
    if (v == null) return null;
    return ActiveVisit.fromJson(v as Map<String, dynamic>);
  }

  static Future<CheckInResult> checkIn({
    required String leadId,
    required double lat,
    required double lng,
  }) async {
    final json = await _post('/api/sales/visits/check-in', {
      'lead_id': leadId,
      'lat': lat,
      'lng': lng,
    });
    return CheckInResult.fromJson(json['visit'] as Map<String, dynamic>);
  }

  static Future<int> checkOut({
    required String visitId,
    double? lat,
    double? lng,
    String? notes,
  }) async {
    final json = await _post('/api/sales/visits/check-out', {
      'visit_id': visitId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return (json['durationSeconds'] as num?)?.toInt() ?? 0;
  }

  /// Assigned leads within `radius` metres of (`lat`, `lng`).
  static Future<List<NearbyLead>> getNearby({
    required double lat,
    required double lng,
    int radius = 1000,
  }) async {
    final json = await _get(
        '/api/sales/nearby?lat=$lat&lng=$lng&radius=$radius');
    return ((json['leads'] as List?) ?? [])
        .map((l) => NearbyLead.fromJson(l as Map<String, dynamic>))
        .toList();
  }

  // ── Follow-ups ─────────────────────────────────────────────────────────

  static Future<Followup> addFollowup({
    required String leadId,
    required String type,
    required String notes,
    String? outcome,
    String? nextFollowupDate,
    String? updateStatus,
  }) async {
    final json = await _post('/api/sales/leads/$leadId/followup', {
      'type': type,
      'notes': notes,
      if (outcome != null) 'outcome': outcome,
      if (nextFollowupDate != null) 'next_followup_date': nextFollowupDate,
      if (updateStatus != null) 'update_status': updateStatus,
    });
    return Followup.fromJson(json['followup'] as Map<String, dynamic>);
  }

  // ── Demos ──────────────────────────────────────────────────────────────

  /// Demos the caller is responsible for conducting.
  static Future<List<Demo>> getDemos() async {
    final json = await _get('/api/sales/demos');
    return ((json['demos'] as List?) ?? [])
        .map((d) => Demo.fromJson(d as Map<String, dynamic>))
        .toList();
  }

  static Future<Demo> scheduleDemo({
    required String leadId,
    required DateTime scheduledAt,
    String? conductedBy,
    int? durationMinutes,
  }) async {
    final json = await _post('/api/sales/demos', {
      'lead_id': leadId,
      'scheduled_at': scheduledAt.toUtc().toIso8601String(),
      if (conductedBy != null) 'conducted_by': conductedBy,
      if (durationMinutes != null) 'duration_minutes': durationMinutes,
    });
    return Demo.fromJson(json['demo'] as Map<String, dynamic>);
  }

  static Future<void> updateDemo(
    String demoId, {
    String? status,
    String? notes,
    String? questionsAsked,
    String? interestLevel,
    int? conversionProbability,
    int? durationMinutes,
  }) async {
    await _request('PATCH', '/api/sales/demos/$demoId', body: {
      if (status != null) 'status': status,
      if (notes != null) 'notes': notes,
      if (questionsAsked != null) 'questions_asked': questionsAsked,
      if (interestLevel != null) 'interest_level': interestLevel,
      if (conversionProbability != null)
        'conversion_probability': conversionProbability,
      if (durationMinutes != null) 'duration_minutes': durationMinutes,
    });
  }

  // ── Trials ─────────────────────────────────────────────────────────────

  /// Create or update a lead's trial. `markUsed` is the one-tap shortcut that
  /// increments login_count and sets last_active_date to today.
  static Future<void> upsertTrial({
    required String leadId,
    String? startDate,
    String? expiryDate,
    String? lastActiveDate,
    int? conversionProbability,
    String? notes,
    bool markUsed = false,
  }) async {
    await _post('/api/sales/trials', {
      'lead_id': leadId,
      if (startDate != null) 'start_date': startDate,
      if (expiryDate != null) 'expiry_date': expiryDate,
      if (lastActiveDate != null) 'last_active_date': lastActiveDate,
      if (conversionProbability != null)
        'conversion_probability': conversionProbability,
      if (notes != null) 'notes': notes,
      if (markUsed) 'mark_used': true,
    });
  }

  // ── Employees (for demo "conducted by" picker) ─────────────────────────

  static Future<List<Employee>> getEmployees() async {
    final json = await _get('/api/sales/employees');
    return ((json['employees'] as List?) ?? [])
        .map((e) => Employee.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Voice notes (text only — on-device STT) ────────────────────────────

  static Future<void> addVoiceNote({
    required String leadId,
    required String transcript,
    int? durationSeconds,
  }) async {
    await _post('/api/sales/voice-notes', {
      'lead_id': leadId,
      'transcript': transcript,
      if (durationSeconds != null) 'duration_seconds': durationSeconds,
    });
  }

  // ── Unified activity timeline ──────────────────────────────────────────

  static Future<List<TimelineEvent>> getTimeline(String leadId) async {
    final json = await _get('/api/sales/timeline/$leadId');
    return ((json['events'] as List?) ?? [])
        .map((e) => TimelineEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── In-app notifications ───────────────────────────────────────────────

  static Future<NotificationsResponse> getNotifications() async {
    final json = await _get('/api/sales/notifications');
    final list = ((json['notifications'] as List?) ?? [])
        .map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
        .toList();
    return NotificationsResponse(
      notifications: list,
      unread: (json['unread'] as num?)?.toInt() ?? 0,
    );
  }

  static Future<void> markNotificationRead(String id) async {
    await _request('PATCH', '/api/sales/notifications', body: {'id': id});
  }

  static Future<void> markAllNotificationsRead() async {
    await _request('PATCH', '/api/sales/notifications', body: {'all': true});
  }
}
