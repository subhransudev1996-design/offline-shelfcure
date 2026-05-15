import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/demo.dart';
import '../models/employee.dart';
import '../models/lead.dart';
import '../models/timeline.dart';
import '../models/visit.dart';
import '../services/location_service.dart';
import '../services/sales_api.dart';
import '../theme.dart';
import '../widgets/voice_note_sheet.dart';

/// Lead detail with GPS check-in / check-out (Phase 4).
class LeadDetailScreen extends StatefulWidget {
  final Lead lead;
  const LeadDetailScreen({super.key, required this.lead});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  ActiveVisit? _activeVisit;
  bool _loadingVisit = true;
  bool _busy = false;
  Timer? _ticker;

  // Pipeline state — initialised from the navigated lead and mutated locally
  // after each successful write so the screen stays in sync without re-fetch.
  late String _status;
  late List<Followup> _followups;
  late List<Demo> _demos;
  Trial? _trial;

  // Unified server-side activity timeline (Phase 6).
  List<TimelineEvent> _timeline = [];
  bool _loadingTimeline = true;

  @override
  void initState() {
    super.initState();
    _status = widget.lead.status;
    _followups = [...widget.lead.followups];
    _demos = [...widget.lead.demos];
    _trial = widget.lead.trial;
    _loadActiveVisit();
    _loadTimeline();
  }

  Future<void> _loadTimeline() async {
    setState(() => _loadingTimeline = true);
    try {
      final events = await SalesApi.getTimeline(widget.lead.id);
      setState(() => _timeline = events);
    } catch (_) {
      // Non-fatal — the rest of the screen still works.
    } finally {
      if (mounted) setState(() => _loadingTimeline = false);
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _loadActiveVisit() async {
    setState(() => _loadingVisit = true);
    try {
      final v = await SalesApi.getActiveVisit();
      setState(() => _activeVisit = v);
      _restartTicker();
    } catch (_) {
      // Failing silently is fine here — the user can still view the lead.
    } finally {
      if (mounted) setState(() => _loadingVisit = false);
    }
  }

  void _restartTicker() {
    _ticker?.cancel();
    if (_activeVisit != null) {
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  // ── Check-in ─────────────────────────────────────────────────────────────

  Future<void> _onCheckIn() async {
    setState(() => _busy = true);
    try {
      final pos = await LocationService.currentPosition();
      final result = await SalesApi.checkIn(
        leadId: widget.lead.id,
        lat: pos.latitude,
        lng: pos.longitude,
      );
      if (!mounted) return;

      final dist = result.distanceFromPinM;
      final far = result.withinRadius == false;
      final msg = dist == null
          ? 'Checked in — pharmacy pinned at your location.'
          : far
              ? 'Checked in — ${dist}m from saved pin (outside ${150}m radius).'
              : 'Checked in — ${dist}m from saved pin.';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: far ? Colors.orange : AppColors.emerald,
        ),
      );
      await _loadActiveVisit();
      unawaited(_loadTimeline());
    } on ApiException catch (e) {
      _toast(e.message);
    } on LocationException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not check in.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Check-out ────────────────────────────────────────────────────────────

  Future<void> _onCheckOut() async {
    final notes = await _askForCheckOutNotes();
    if (notes == null || !mounted) return; // cancelled

    setState(() => _busy = true);
    double? lat;
    double? lng;
    try {
      final pos = await LocationService.currentPosition();
      lat = pos.latitude;
      lng = pos.longitude;
    } catch (_) {
      // Check-out without GPS still works — record the visit anyway.
    }

    try {
      final seconds = await SalesApi.checkOut(
        visitId: _activeVisit!.id,
        lat: lat,
        lng: lng,
        notes: notes,
      );
      if (!mounted) return;
      _toast(
        'Visit checked out — ${_formatDuration(seconds)}.',
        color: AppColors.emerald,
      );
      await _loadActiveVisit();
      unawaited(_loadTimeline());
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not check out.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<String?> _askForCheckOutNotes() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Check Out'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Visit notes — what was discussed?',
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Check Out')),
        ],
      ),
    );
    return ok == true ? ctrl.text.trim() : null;
  }

  void _toast(String msg, {Color? color}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: color),
    );
  }

  // ── Log Follow-up ────────────────────────────────────────────────────────

  Future<void> _onLogFollowup() async {
    final result = await showModalBottomSheet<_FollowupResult>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _FollowupSheet(currentStatus: _status),
    );
    if (result == null || !mounted) return;

    setState(() => _busy = true);
    try {
      final fu = await SalesApi.addFollowup(
        leadId: widget.lead.id,
        type: result.type,
        notes: result.notes,
        outcome: result.outcome,
        nextFollowupDate: result.nextDate,
      );
      setState(() {
        _followups = [fu, ..._followups];
      });
      unawaited(_loadTimeline());
      _toast('Follow-up logged.', color: AppColors.emerald);
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not log follow-up.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Schedule Demo ────────────────────────────────────────────────────────

  Future<void> _onScheduleDemo() async {
    // Fetch the employee list for the "Conducted by" picker.
    List<Employee> employees = const [];
    try {
      employees = await SalesApi.getEmployees();
    } on ApiException catch (e) {
      _toast(e.message);
      return;
    }
    if (!mounted) return;

    final result = await showModalBottomSheet<_DemoScheduleResult>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _DemoScheduleSheet(employees: employees),
    );
    if (result == null || !mounted) return;

    setState(() => _busy = true);
    try {
      final demo = await SalesApi.scheduleDemo(
        leadId: widget.lead.id,
        scheduledAt: result.scheduledAt,
        conductedBy: result.conductedBy,
        durationMinutes: result.durationMinutes,
      );
      setState(() {
        _demos = [..._demos, demo];
        _status = 'demo_scheduled';
      });
      unawaited(_loadTimeline());
      _toast('Demo scheduled.', color: AppColors.emerald);
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not schedule demo.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Complete Demo ───────────────────────────────────────────────────────

  Future<void> _onCompleteDemo(Demo d) async {
    final result = await showModalBottomSheet<_DemoCompleteResult>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _DemoCompleteSheet(),
    );
    if (result == null || !mounted) return;

    setState(() => _busy = true);
    try {
      await SalesApi.updateDemo(
        d.id,
        status: 'completed',
        notes: result.notes,
        questionsAsked: result.questionsAsked,
        interestLevel: result.interestLevel,
        conversionProbability: result.conversionProbability,
      );
      setState(() {
        _demos = _demos
            .map((x) => x.id == d.id
                ? Demo(
                    id: x.id,
                    leadId: x.leadId,
                    conductedBy: x.conductedBy,
                    scheduledAt: x.scheduledAt,
                    status: 'completed',
                    durationMinutes: x.durationMinutes,
                    notes: result.notes,
                    questionsAsked: result.questionsAsked,
                    interestLevel: result.interestLevel,
                    conversionProbability: result.conversionProbability,
                    completedAt: DateTime.now(),
                    leadName: x.leadName,
                  )
                : x)
            .toList();
        _status = 'demo_done';
      });
      unawaited(_loadTimeline());
      _toast('Demo marked complete.', color: AppColors.emerald);
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not update demo.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Trial ────────────────────────────────────────────────────────────────

  Future<void> _onStartOrEditTrial() async {
    final result = await showModalBottomSheet<_TrialResult>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _TrialSheet(existing: _trial),
    );
    if (result == null || !mounted) return;

    setState(() => _busy = true);
    try {
      await SalesApi.upsertTrial(
        leadId: widget.lead.id,
        expiryDate: result.expiryDate,
        notes: result.notes,
        conversionProbability: result.conversionProbability,
      );
      // Refresh local trial via a quick re-fetch of leads (minimal API surface).
      await _refreshTrialFromServer();
      if (_trial != null) {
        setState(() {
          if (_status != 'trial_activated' && _status != 'converted') {
            _status = 'trial_activated';
          }
        });
      }
      unawaited(_loadTimeline());
      _toast('Trial saved.', color: AppColors.emerald);
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not save trial.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _onMarkTrialUsed() async {
    setState(() => _busy = true);
    try {
      await SalesApi.upsertTrial(leadId: widget.lead.id, markUsed: true);
      await _refreshTrialFromServer();
      unawaited(_loadTimeline());
      _toast('Trial marked active today.', color: AppColors.emerald);
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not update trial.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Voice note ───────────────────────────────────────────────────────────

  Future<void> _onVoiceNote() async {
    final result = await showModalBottomSheet<VoiceNoteResult>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const VoiceNoteSheet(),
    );
    if (result == null || !mounted) return;

    setState(() => _busy = true);
    try {
      await SalesApi.addVoiceNote(
        leadId: widget.lead.id,
        transcript: result.transcript,
        durationSeconds: result.durationSeconds,
      );
      await _loadTimeline();
      _toast('Voice note saved.', color: AppColors.emerald);
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (_) {
      _toast('Could not save voice note.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _refreshTrialFromServer() async {
    try {
      final leads = await SalesApi.getLeads();
      final fresh = leads.firstWhere(
        (l) => l.id == widget.lead.id,
        orElse: () => widget.lead,
      );
      setState(() => _trial = fresh.trial);
    } catch (_) {
      /* leave local state alone */
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final lead = widget.lead;
    return Scaffold(
      appBar: AppBar(title: Text(lead.displayName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _headerCard(lead),
          const SizedBox(height: 12),
          if (!_loadingVisit) _visitBanner(),
          const SizedBox(height: 12),
          _quickActionsRow(),
          const SizedBox(height: 12),
          _section('Lead Info', [
            _row('Phone', lead.phone),
            _row('WhatsApp', lead.whatsappNumber),
            _row('Email', lead.email),
            _row('Address', lead.address),
            _row(
                'Location',
                [lead.city, lead.state]
                    .where((e) => e?.isNotEmpty == true)
                    .join(', ')),
            _row('Source', lead.source),
            _row('Priority Score', lead.priorityScore.toString()),
            if (lead.gpsLat != null && lead.gpsLng != null)
              _row('GPS',
                  '${lead.gpsLat!.toStringAsFixed(5)}, ${lead.gpsLng!.toStringAsFixed(5)}'),
          ]),
          if (lead.notes?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            _section('Notes', [
              Text(lead.notes!,
                  style: const TextStyle(fontSize: 13.5, height: 1.4)),
            ]),
          ],
          const SizedBox(height: 12),
          _demosSection(),
          const SizedBox(height: 12),
          _trialSection(),
          const SizedBox(height: 12),
          _timelineSection(),
        ],
      ),
    );
  }

  // ── Unified timeline ────────────────────────────────────────────────────

  Widget _timelineSection() {
    final children = <Widget>[];
    if (_loadingTimeline && _timeline.isEmpty) {
      children.add(const Padding(
        padding: EdgeInsets.symmetric(vertical: 6),
        child: Center(child: SizedBox(
            height: 16, width: 16,
            child: CircularProgressIndicator(strokeWidth: 2))),
      ));
    } else if (_timeline.isEmpty) {
      children.add(Text('No activity yet.',
          style: TextStyle(
              color: Colors.black.withValues(alpha: 0.4), fontSize: 13)));
    } else {
      for (final e in _timeline) {
        children.add(_timelineTile(e));
      }
    }
    return _section('Activity Timeline (${_timeline.length})', children);
  }

  Widget _timelineTile(TimelineEvent e) {
    final dt = DateFormat('dd MMM yyyy · hh:mm a').format(e.createdAt.toLocal());
    final color = _timelineColor(e.eventType);
    final icon = _timelineIcon(e.eventType);

    String body = '';
    final p = e.payload;
    switch (e.eventType) {
      case 'followup':
        body = '${(p['type'] ?? '').toString().toUpperCase()}'
            '${p['outcome'] != null ? ' · ${p['outcome']}' : ''}'
            '${p['notes_preview'] != null ? '\n${p['notes_preview']}' : ''}';
        break;
      case 'voice_note':
        body = (p['transcript'] ?? '').toString();
        break;
      case 'visit_check_in':
        final d = p['distance_from_pin_m'];
        body = d == null ? 'Visit started' : '${d}m from saved pin';
        break;
      case 'visit_check_out':
        final s = p['duration_seconds'];
        body = s is num
            ? 'Lasted ${(s / 60).toStringAsFixed(1)} min'
            : 'Visit ended';
        if (p['notes_preview'] != null) body += '\n${p['notes_preview']}';
        break;
      case 'demo_scheduled':
        body = p['scheduled_at'] != null
            ? 'For ${p['scheduled_at']}'
            : '';
        break;
      case 'demo_completed':
        body = [
          if (p['interest_level'] != null) 'Interest: ${p['interest_level']}',
          if (p['conversion_probability'] != null)
            '${p['conversion_probability']}% likely',
          if (p['notes_preview'] != null) '${p['notes_preview']}',
        ].join(' · ');
        break;
      case 'trial_started':
      case 'trial_updated':
        body = p['expiry_date'] != null ? 'Expires ${p['expiry_date']}' : '';
        break;
      case 'trial_used':
        body = p['login_count'] != null ? 'Logins: ${p['login_count']}' : 'Used today';
        break;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.12),
            ),
            child: Icon(icon, size: 15, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(e.label,
                        style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            color: color)),
                    if (e.actorName != null) ...[
                      const SizedBox(width: 6),
                      Text('· ${e.actorName}',
                          style: TextStyle(
                              fontSize: 11.5,
                              color: Colors.black.withValues(alpha: 0.45))),
                    ],
                  ],
                ),
                if (body.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(body,
                        style: const TextStyle(fontSize: 13, height: 1.35)),
                  ),
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text(dt,
                      style: TextStyle(
                          fontSize: 11,
                          color: Colors.black.withValues(alpha: 0.4))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _timelineColor(String t) => switch (t) {
        'followup' => AppColors.navy,
        'voice_note' => const Color(0xFF7C3AED),
        'visit_check_in' || 'visit_check_out' => AppColors.cyan,
        'demo_scheduled' => const Color(0xFF4F46E5),
        'demo_completed' => const Color(0xFF7E22CE),
        'trial_started' || 'trial_used' || 'trial_updated' => AppColors.emerald,
        'assigned' => const Color(0xFFB45309),
        'converted' => AppColors.emerald,
        _ => Colors.black54,
      };

  IconData _timelineIcon(String t) => switch (t) {
        'followup' => Icons.note_alt_outlined,
        'voice_note' => Icons.mic_none_outlined,
        'visit_check_in' => Icons.login,
        'visit_check_out' => Icons.logout,
        'demo_scheduled' => Icons.event_outlined,
        'demo_completed' => Icons.event_available,
        'trial_started' => Icons.flag_outlined,
        'trial_used' => Icons.bolt_outlined,
        'trial_updated' => Icons.edit_outlined,
        'assigned' => Icons.person_add_outlined,
        'converted' => Icons.check_circle_outline,
        _ => Icons.circle_outlined,
      };

  // ── Quick-actions strip ─────────────────────────────────────────────────

  Widget _quickActionsRow() {
    Widget chip(IconData icon, String label, VoidCallback? onTap) => Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy ? null : onTap,
            icon: Icon(icon, size: 16),
            label: Text(label,
                style: const TextStyle(fontSize: 12.5),
                overflow: TextOverflow.ellipsis),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        );

    return Column(
      children: [
        Row(
          children: [
            chip(Icons.note_add_outlined, 'Follow-up', _onLogFollowup),
            const SizedBox(width: 8),
            chip(Icons.event_outlined, 'Demo', _onScheduleDemo),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            chip(Icons.mic_none_outlined, 'Voice Note', _onVoiceNote),
            const SizedBox(width: 8),
            chip(
                _trial == null ? Icons.flag_outlined : Icons.bolt_outlined,
                _trial == null ? 'Start Trial' : 'Trial Used',
                _trial == null ? _onStartOrEditTrial : _onMarkTrialUsed),
          ],
        ),
      ],
    );
  }

  // ── Demos section ───────────────────────────────────────────────────────

  Widget _demosSection() {
    return _section('Demos (${_demos.length})', [
      if (_demos.isEmpty)
        Text('No demo scheduled.',
            style: TextStyle(
                color: Colors.black.withValues(alpha: 0.4), fontSize: 13))
      else
        ..._demos.map(_demoTile),
    ]);
  }

  Widget _demoTile(Demo d) {
    final dt = DateFormat('EEE dd MMM, hh:mm a').format(d.scheduledAt.toLocal());
    final statusColor = switch (d.status) {
      'completed' => AppColors.emerald,
      'no_show' => const Color(0xFFEF4444),
      'cancelled' => const Color(0xFF94A3B8),
      _ => AppColors.cyan,
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(11),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.calendar_today,
                    size: 13, color: Colors.black54),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(dt,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(d.status.replaceAll('_', ' '),
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            if (d.notes?.isNotEmpty == true) ...[
              const SizedBox(height: 4),
              Text(d.notes!, style: const TextStyle(fontSize: 12.5)),
            ],
            if (d.interestLevel != null || d.conversionProbability != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  [
                    if (d.interestLevel != null)
                      'Interest: ${d.interestLevel}',
                    if (d.conversionProbability != null)
                      '${d.conversionProbability}% likely',
                  ].join(' · '),
                  style: const TextStyle(
                      fontSize: 11.5, color: Colors.black54),
                ),
              ),
            if (d.isOpen) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _busy ? null : () => _onCompleteDemo(d),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Mark Complete'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Trial section ───────────────────────────────────────────────────────

  Widget _trialSection() {
    final t = _trial;
    return _section('Trial', [
      if (t == null) ...[
        Text('No trial started yet.',
            style: TextStyle(
                color: Colors.black.withValues(alpha: 0.4), fontSize: 13)),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _busy ? null : _onStartOrEditTrial,
          icon: const Icon(Icons.flag_outlined, size: 16),
          label: const Text('Start Trial'),
        ),
      ] else ...[
        _row('Started', t.startDate),
        _row('Expires', t.expiryDate),
        _row('Last Active', t.lastActiveDate ?? '—'),
        _row('Logins', t.loginCount.toString()),
        if (t.conversionProbability != null)
          _row('Likelihood', '${t.conversionProbability}%'),
        if (t.notes?.isNotEmpty == true)
          _row('Notes', t.notes),
        if (t.isExpired)
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 8),
            child: Text('Trial expired',
                style: TextStyle(
                    color: Colors.red.withValues(alpha: 0.8),
                    fontSize: 12,
                    fontWeight: FontWeight.bold)),
          ),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _onMarkTrialUsed,
                icon: const Icon(Icons.bolt_outlined, size: 16),
                label: const Text('Used Today'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _onStartOrEditTrial,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Edit'),
              ),
            ),
          ],
        ),
      ],
    ]);
  }

  Widget _headerCard(Lead lead) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(lead.displayName,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              _statusPill(_status),
            ],
          ),
          if (lead.pharmacyName?.isNotEmpty == true &&
              lead.ownerName.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text('Owner: ${lead.ownerName}',
                style: TextStyle(
                    color: Colors.black.withValues(alpha: 0.5),
                    fontSize: 13)),
          ],
          if (lead.convertedLicenseKey != null) ...[
            const SizedBox(height: 10),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.emerald.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('Converted · ${lead.convertedLicenseKey}',
                  style: const TextStyle(
                      color: AppColors.emerald,
                      fontWeight: FontWeight.bold,
                      fontSize: 12)),
            ),
          ],
        ],
      ),
    );
  }

  /// Top banner that turns into "Check In" or "Check Out" depending on whether
  /// the user currently has an open visit (and whether it's for THIS lead).
  Widget _visitBanner() {
    final av = _activeVisit;

    if (av == null) {
      return _bannerButton(
        icon: Icons.login,
        label: 'Check In to this Pharmacy',
        color: AppColors.navy,
        onTap: _busy ? null : _onCheckIn,
      );
    }

    if (av.leadId == widget.lead.id) {
      final elapsed = DateTime.now().difference(av.checkInAt);
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.emerald.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.emerald.withValues(alpha: 0.30)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.timer_outlined,
                    color: AppColors.emerald, size: 18),
                const SizedBox(width: 6),
                Text('Visit in progress · ${_formatDuration(elapsed.inSeconds)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.emerald)),
              ],
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _busy ? null : _onCheckOut,
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Check Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emerald,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Color(0xFFB45309), size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'You have an open visit at ${av.leadName}. Check out there before starting a new one.',
              style: const TextStyle(
                  color: Color(0xFFB45309), fontSize: 12.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bannerButton({
    required IconData icon,
    required String label,
    required Color color,
    VoidCallback? onTap,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: _busy
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white))
            : Icon(icon, size: 18),
        label: Text(label),
        style: ElevatedButton.styleFrom(
            backgroundColor: color, padding: const EdgeInsets.symmetric(vertical: 16)),
      ),
    );
  }

  // ── Shared bits with the Phase 3 detail screen ───────────────────────────

  Widget _section(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  Widget _row(String label, String? value) {
    if (value == null || value.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label,
                style: TextStyle(
                    fontSize: 12.5,
                    color: Colors.black.withValues(alpha: 0.45),
                    fontWeight: FontWeight.w600)),
          ),
          Expanded(
              child: Text(value, style: const TextStyle(fontSize: 13.5))),
        ],
      ),
    );
  }

  Widget _statusPill(String status) {
    final color = LeadStatus.color(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(LeadStatus.label(status),
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  String _formatDuration(int totalSeconds) {
    final h = totalSeconds ~/ 3600;
    final m = (totalSeconds % 3600) ~/ 60;
    final s = totalSeconds % 60;
    if (h > 0) {
      return '${h}h ${m.toString().padLeft(2, '0')}m';
    }
    return '${m}m ${s.toString().padLeft(2, '0')}s';
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  Bottom-sheet widgets used by the action handlers above.
// ════════════════════════════════════════════════════════════════════════════

EdgeInsets _sheetInsets(BuildContext c) => EdgeInsets.fromLTRB(
      16,
      16,
      16,
      MediaQuery.of(c).viewInsets.bottom + 16,
    );

// ── Follow-up ───────────────────────────────────────────────────────────────

class _FollowupResult {
  final String type;
  final String notes;
  final String? outcome;
  final String? nextDate;
  _FollowupResult({
    required this.type,
    required this.notes,
    this.outcome,
    this.nextDate,
  });
}

class _FollowupSheet extends StatefulWidget {
  final String currentStatus;
  const _FollowupSheet({required this.currentStatus});
  @override
  State<_FollowupSheet> createState() => _FollowupSheetState();
}

class _FollowupSheetState extends State<_FollowupSheet> {
  static const _types = [
    {'v': 'call', 'l': 'Call'},
    {'v': 'whatsapp', 'l': 'WhatsApp'},
    {'v': 'visit', 'l': 'Visit'},
    {'v': 'email', 'l': 'Email'},
    {'v': 'demo', 'l': 'Demo'},
  ];
  static const _outcomes = [
    {'v': 'interested', 'l': 'Interested'},
    {'v': 'not_interested', 'l': 'Not interested'},
    {'v': 'callback', 'l': 'Callback requested'},
    {'v': 'demo_scheduled', 'l': 'Demo scheduled'},
    {'v': 'no_answer', 'l': 'No answer'},
    {'v': 'closed_won', 'l': 'Closed (won)'},
    {'v': 'closed_lost', 'l': 'Closed (lost)'},
  ];

  String _type = 'call';
  String? _outcome;
  DateTime? _next;
  final _notes = TextEditingController();

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _next = picked);
  }

  void _submit() {
    if (_notes.text.trim().isEmpty) return;
    Navigator.pop(
      context,
      _FollowupResult(
        type: _type,
        notes: _notes.text.trim(),
        outcome: _outcome,
        nextDate: _next == null
            ? null
            : DateFormat('yyyy-MM-dd').format(_next!),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: _sheetInsets(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Log Follow-up',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),
          Wrap(
            spacing: 6,
            children: _types
                .map((t) => ChoiceChip(
                      label: Text(t['l']!),
                      selected: _type == t['v'],
                      onSelected: (_) => setState(() => _type = t['v']!),
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notes,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Notes *',
              hintText: 'What was discussed?',
            ),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String?>(
            initialValue: _outcome,
            decoration: const InputDecoration(labelText: 'Outcome'),
            items: [
              const DropdownMenuItem(value: null, child: Text('—')),
              ..._outcomes.map((o) =>
                  DropdownMenuItem(value: o['v'], child: Text(o['l']!))),
            ],
            onChanged: (v) => setState(() => _outcome = v),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.event),
            label: Text(_next == null
                ? 'Next follow-up date (optional)'
                : DateFormat('EEE, dd MMM yyyy').format(_next!)),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
                onPressed: _notes.text.trim().isEmpty ? null : _submit,
                child: const Text('Log Follow-up')),
          ),
        ],
      ),
    );
  }
}

// ── Schedule Demo ───────────────────────────────────────────────────────────

class _DemoScheduleResult {
  final DateTime scheduledAt;
  final String? conductedBy;
  final int? durationMinutes;
  _DemoScheduleResult({
    required this.scheduledAt,
    this.conductedBy,
    this.durationMinutes,
  });
}

class _DemoScheduleSheet extends StatefulWidget {
  final List<Employee> employees;
  const _DemoScheduleSheet({required this.employees});
  @override
  State<_DemoScheduleSheet> createState() => _DemoScheduleSheetState();
}

class _DemoScheduleSheetState extends State<_DemoScheduleSheet> {
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _time = const TimeOfDay(hour: 10, minute: 30);
  String? _conductor;
  final _duration = TextEditingController(text: '30');

  @override
  void dispose() {
    _duration.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d != null) setState(() => _date = d);
  }

  Future<void> _pickTime() async {
    final t = await showTimePicker(context: context, initialTime: _time);
    if (t != null) setState(() => _time = t);
  }

  void _submit() {
    final dt = DateTime(_date.year, _date.month, _date.day, _time.hour, _time.minute);
    final dur = int.tryParse(_duration.text.trim());
    Navigator.pop(
      context,
      _DemoScheduleResult(
          scheduledAt: dt,
          conductedBy: _conductor,
          durationMinutes: dur),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: _sheetInsets(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Schedule Demo',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: const Icon(Icons.event),
                    label: Text(DateFormat('dd MMM yyyy').format(_date))),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                    onPressed: _pickTime,
                    icon: const Icon(Icons.access_time),
                    label: Text(_time.format(context))),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String?>(
            initialValue: _conductor,
            decoration: const InputDecoration(labelText: 'Conducted by'),
            items: [
              const DropdownMenuItem(value: null, child: Text('Me')),
              ...widget.employees.map((e) => DropdownMenuItem(
                    value: e.id,
                    child: Text('${e.fullName} · ${e.roleLabel}'),
                  )),
            ],
            onChanged: (v) => setState(() => _conductor = v),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _duration,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Duration (minutes)'),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
                onPressed: _submit, child: const Text('Schedule Demo')),
          ),
        ],
      ),
    );
  }
}

// ── Complete Demo ──────────────────────────────────────────────────────────

class _DemoCompleteResult {
  final String notes;
  final String? questionsAsked;
  final String? interestLevel;
  final int? conversionProbability;
  _DemoCompleteResult({
    required this.notes,
    this.questionsAsked,
    this.interestLevel,
    this.conversionProbability,
  });
}

class _DemoCompleteSheet extends StatefulWidget {
  const _DemoCompleteSheet();
  @override
  State<_DemoCompleteSheet> createState() => _DemoCompleteSheetState();
}

class _DemoCompleteSheetState extends State<_DemoCompleteSheet> {
  final _notes = TextEditingController();
  final _questions = TextEditingController();
  String? _interest;
  double _prob = 50;

  @override
  void dispose() {
    _notes.dispose();
    _questions.dispose();
    super.dispose();
  }

  void _submit() {
    Navigator.pop(
      context,
      _DemoCompleteResult(
        notes: _notes.text.trim(),
        questionsAsked: _questions.text.trim().isEmpty
            ? null
            : _questions.text.trim(),
        interestLevel: _interest,
        conversionProbability: _prob.round(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: _sheetInsets(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Complete Demo',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),
          TextField(
            controller: _notes,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Feedback / Notes'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _questions,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Questions asked'),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            children: const [
              {'v': 'low', 'l': 'Low interest'},
              {'v': 'medium', 'l': 'Medium'},
              {'v': 'high', 'l': 'High interest'},
            ]
                .map((m) => ChoiceChip(
                      label: Text(m['l']!),
                      selected: _interest == m['v'],
                      onSelected: (_) => setState(() => _interest = m['v']),
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          Text('Conversion likelihood: ${_prob.round()}%'),
          Slider(
              value: _prob,
              min: 0,
              max: 100,
              divisions: 20,
              label: '${_prob.round()}%',
              onChanged: (v) => setState(() => _prob = v)),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
                onPressed: _submit,
                child: const Text('Mark Complete')),
          ),
        ],
      ),
    );
  }
}

// ── Trial (start / edit) ───────────────────────────────────────────────────

class _TrialResult {
  final String? expiryDate;
  final int? conversionProbability;
  final String? notes;
  _TrialResult({this.expiryDate, this.conversionProbability, this.notes});
}

class _TrialSheet extends StatefulWidget {
  final Trial? existing;
  const _TrialSheet({this.existing});
  @override
  State<_TrialSheet> createState() => _TrialSheetState();
}

class _TrialSheetState extends State<_TrialSheet> {
  DateTime? _expiry;
  double _prob = 50;
  late final TextEditingController _notes;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e?.expiryDate != null) {
      _expiry = DateTime.tryParse(e!.expiryDate!);
    } else {
      _expiry = DateTime.now().add(const Duration(days: 14));
    }
    _prob = (e?.conversionProbability ?? 50).toDouble();
    _notes = TextEditingController(text: e?.notes ?? '');
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickExpiry() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _expiry ?? DateTime.now().add(const Duration(days: 14)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d != null) setState(() => _expiry = d);
  }

  void _submit() {
    Navigator.pop(
      context,
      _TrialResult(
        expiryDate: _expiry == null
            ? null
            : DateFormat('yyyy-MM-dd').format(_expiry!),
        conversionProbability: _prob.round(),
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: _sheetInsets(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.existing == null ? 'Start Trial' : 'Edit Trial',
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: _pickExpiry,
            icon: const Icon(Icons.event),
            label: Text(_expiry == null
                ? 'Expiry date'
                : 'Expires ${DateFormat('EEE, dd MMM yyyy').format(_expiry!)}'),
          ),
          const SizedBox(height: 12),
          Text('Conversion likelihood: ${_prob.round()}%'),
          Slider(
              value: _prob,
              min: 0,
              max: 100,
              divisions: 20,
              label: '${_prob.round()}%',
              onChanged: (v) => setState(() => _prob = v)),
          const SizedBox(height: 4),
          TextField(
            controller: _notes,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Notes (optional)'),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
                onPressed: _submit, child: const Text('Save')),
          ),
        ],
      ),
    );
  }
}
