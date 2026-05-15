/// In-app notification row from /api/sales/notifications.
class AppNotification {
  final String id;
  final String kind;
  final String title;
  final String? body;
  final String? leadId;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.kind,
    required this.title,
    this.body,
    this.leadId,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] as String,
        kind: (j['kind'] ?? '') as String,
        title: (j['title'] ?? '') as String,
        body: j['body'] as String?,
        leadId: j['lead_id'] as String?,
        isRead: (j['is_read'] ?? false) as bool,
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

class NotificationsResponse {
  final List<AppNotification> notifications;
  final int unread;
  NotificationsResponse({required this.notifications, required this.unread});
}
