/// One entry in a lead's activity timeline (server-side aggregated).
class TimelineEvent {
  final String id;
  final String eventType;
  final Map<String, dynamic> payload;
  final String? actorId;
  final String? actorName;
  final DateTime createdAt;

  TimelineEvent({
    required this.id,
    required this.eventType,
    required this.payload,
    this.actorId,
    this.actorName,
    required this.createdAt,
  });

  factory TimelineEvent.fromJson(Map<String, dynamic> j) => TimelineEvent(
        id: j['id'] as String,
        eventType: (j['event_type'] ?? '') as String,
        payload: (j['payload'] as Map?)?.cast<String, dynamic>() ?? const {},
        actorId: j['actor_id'] as String?,
        actorName: j['actor_name'] as String?,
        createdAt: DateTime.parse(j['created_at'] as String),
      );

  /// Short human label for this event type.
  String get label {
    switch (eventType) {
      case 'followup':         return 'Follow-up';
      case 'demo_scheduled':   return 'Demo scheduled';
      case 'demo_completed':   return 'Demo completed';
      case 'visit_check_in':   return 'Checked in';
      case 'visit_check_out':  return 'Checked out';
      case 'trial_started':    return 'Trial started';
      case 'trial_used':       return 'Trial used';
      case 'trial_updated':    return 'Trial updated';
      case 'voice_note':       return 'Voice note';
      case 'status_changed':   return 'Status changed';
      case 'assigned':         return 'Assigned';
      case 'converted':        return 'Converted';
      default:                 return eventType.replaceAll('_', ' ');
    }
  }
}
