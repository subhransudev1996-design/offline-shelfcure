import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/app_notification.dart';
import '../services/sales_api.dart';
import '../theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _list = [];
  int _unread = 0;
  bool _loading = true;
  String? _error;

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
      final res = await SalesApi.getNotifications();
      setState(() {
        _list = res.notifications;
        _unread = res.unread;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not load notifications.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markRead(AppNotification n) async {
    if (n.isRead) return;
    try {
      await SalesApi.markNotificationRead(n.id);
      setState(() {
        _list = _list
            .map((x) => x.id == n.id
                ? AppNotification(
                    id: x.id,
                    kind: x.kind,
                    title: x.title,
                    body: x.body,
                    leadId: x.leadId,
                    isRead: true,
                    createdAt: x.createdAt,
                  )
                : x)
            .toList();
        _unread = (_unread - 1).clamp(0, 1 << 30);
      });
    } catch (_) {
      // non-fatal — next refresh will reconcile
    }
  }

  Future<void> _markAll() async {
    try {
      await SalesApi.markAllNotificationsRead();
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unread > 0)
            TextButton(
              onPressed: _markAll,
              child: const Text('Mark all read',
                  style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _list.isEmpty
                  ? Center(
                      child: Text('Nothing here yet.',
                          style: TextStyle(
                              color: Colors.black.withValues(alpha: 0.4))),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _list.length,
                        separatorBuilder: (_, __) =>
                            const Divider(height: 1, indent: 16, endIndent: 16),
                        itemBuilder: (_, i) => _tile(_list[i]),
                      ),
                    ),
    );
  }

  Widget _tile(AppNotification n) {
    final dt = DateFormat('dd MMM, hh:mm a').format(n.createdAt.toLocal());
    return ListTile(
      tileColor: n.isRead ? null : AppColors.cyan.withValues(alpha: 0.07),
      leading: CircleAvatar(
        radius: 18,
        backgroundColor: AppColors.navy.withValues(alpha: 0.1),
        child: Icon(_iconFor(n.kind), size: 16, color: AppColors.navy),
      ),
      title: Text(n.title,
          style: TextStyle(
              fontSize: 14,
              fontWeight: n.isRead ? FontWeight.w500 : FontWeight.bold)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (n.body != null) Text(n.body!, style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 2),
          Text(dt,
              style: TextStyle(
                  fontSize: 11, color: Colors.black.withValues(alpha: 0.5))),
        ],
      ),
      onTap: () => _markRead(n),
    );
  }

  IconData _iconFor(String kind) {
    switch (kind) {
      case 'demo_assigned':
        return Icons.event_outlined;
      case 'lead_assigned':
        return Icons.person_add_outlined;
      default:
        return Icons.notifications_none;
    }
  }
}
