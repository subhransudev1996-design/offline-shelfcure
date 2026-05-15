/// A demo scheduled (or completed) for a lead.
class Demo {
  final String id;
  final String leadId;
  final String? conductedBy;
  final DateTime scheduledAt;
  final String status; // scheduled | completed | no_show | cancelled
  final int? durationMinutes;
  final String? notes;
  final String? questionsAsked;
  final String? interestLevel;        // low | medium | high
  final int? conversionProbability;   // 0..100
  final DateTime? completedAt;
  // Populated when fetched from /api/sales/demos (nested lead).
  final String? leadName;

  Demo({
    required this.id,
    required this.leadId,
    this.conductedBy,
    required this.scheduledAt,
    required this.status,
    this.durationMinutes,
    this.notes,
    this.questionsAsked,
    this.interestLevel,
    this.conversionProbability,
    this.completedAt,
    this.leadName,
  });

  factory Demo.fromJson(Map<String, dynamic> j) {
    String? leadName;
    final lead = j['leads'];
    if (lead is Map) {
      leadName = (lead['pharmacy_name'] as String?) ??
          (lead['owner_name'] as String?);
    }
    return Demo(
      id: j['id'] as String,
      leadId: j['lead_id'] as String,
      conductedBy: j['conducted_by'] as String?,
      scheduledAt: DateTime.parse(j['scheduled_at'] as String),
      status: (j['status'] ?? 'scheduled') as String,
      durationMinutes: (j['duration_minutes'] as num?)?.toInt(),
      notes: j['notes'] as String?,
      questionsAsked: j['questions_asked'] as String?,
      interestLevel: j['interest_level'] as String?,
      conversionProbability:
          (j['conversion_probability'] as num?)?.toInt(),
      completedAt: j['completed_at'] != null
          ? DateTime.parse(j['completed_at'] as String)
          : null,
      leadName: leadName,
    );
  }

  bool get isOpen => status == 'scheduled';
}

/// An active or expired trial on a lead (pre-conversion).
class Trial {
  final String id;
  final String leadId;
  final String startDate;             // ISO date (YYYY-MM-DD)
  final String? expiryDate;
  final String? lastActiveDate;
  final int loginCount;
  final int? conversionProbability;
  final String? notes;

  Trial({
    required this.id,
    required this.leadId,
    required this.startDate,
    this.expiryDate,
    this.lastActiveDate,
    required this.loginCount,
    this.conversionProbability,
    this.notes,
  });

  factory Trial.fromJson(Map<String, dynamic> j) => Trial(
        id: j['id'] as String,
        leadId: j['lead_id'] as String,
        startDate: (j['start_date'] ?? '') as String,
        expiryDate: j['expiry_date'] as String?,
        lastActiveDate: j['last_active_date'] as String?,
        loginCount: (j['login_count'] as num?)?.toInt() ?? 0,
        conversionProbability:
            (j['conversion_probability'] as num?)?.toInt(),
        notes: j['notes'] as String?,
      );

  bool get isExpired {
    if (expiryDate == null) return false;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    return expiryDate!.compareTo(today) < 0;
  }
}
