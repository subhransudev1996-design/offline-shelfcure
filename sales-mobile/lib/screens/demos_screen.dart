import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/demo.dart';
import '../services/sales_api.dart';
import '../theme.dart';

/// Demos the signed-in user is responsible for conducting.
class DemosScreen extends StatefulWidget {
  const DemosScreen({super.key});

  @override
  State<DemosScreen> createState() => _DemosScreenState();
}

class _DemosScreenState extends State<DemosScreen> {
  List<Demo> _demos = [];
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
      final d = await SalesApi.getDemos();
      setState(() => _demos = d);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not load demos.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _complete(Demo d) async {
    final result = await showModalBottomSheet<_CompleteResult>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _CompleteSheet(),
    );
    if (result == null || !mounted) return;
    try {
      await SalesApi.updateDemo(
        d.id,
        status: 'completed',
        notes: result.notes,
        interestLevel: result.interest,
        conversionProbability: result.probability,
      );
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Demo marked complete.'),
              backgroundColor: AppColors.emerald),
        );
      }
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
        title: const Text('My Demos'),
        actions: [
          IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loading ? null : _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _demos.isEmpty
                  ? Center(
                      child: Text('No demos assigned yet.',
                          style: TextStyle(
                              color: Colors.black.withValues(alpha: 0.4))),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _demos.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 8),
                        itemBuilder: (_, i) =>
                            _tile(_demos[i]),
                      ),
                    ),
    );
  }

  Widget _tile(Demo d) {
    final dt = DateFormat('EEE dd MMM · hh:mm a')
        .format(d.scheduledAt.toLocal());
    final statusColor = switch (d.status) {
      'completed' => AppColors.emerald,
      'no_show' => const Color(0xFFEF4444),
      'cancelled' => const Color(0xFF94A3B8),
      _ => AppColors.cyan,
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(d.leadName ?? 'Lead',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 14)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
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
          const SizedBox(height: 4),
          Text(dt,
              style: const TextStyle(fontSize: 12, color: Colors.black54)),
          if (d.isOpen) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _complete(d),
                icon: const Icon(Icons.check, size: 16),
                label: const Text('Mark Complete'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Complete sheet (compact local copy) ──────────────────────────────────

class _CompleteResult {
  final String notes;
  final String? interest;
  final int probability;
  _CompleteResult(
      {required this.notes, this.interest, required this.probability});
}

class _CompleteSheet extends StatefulWidget {
  const _CompleteSheet();
  @override
  State<_CompleteSheet> createState() => _CompleteSheetState();
}

class _CompleteSheetState extends State<_CompleteSheet> {
  final _notes = TextEditingController();
  String? _interest;
  double _prob = 50;

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
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
              decoration:
                  const InputDecoration(labelText: 'Feedback / Notes')),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            children: const [
              {'v': 'low', 'l': 'Low'},
              {'v': 'medium', 'l': 'Medium'},
              {'v': 'high', 'l': 'High'},
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
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(
                context,
                _CompleteResult(
                  notes: _notes.text.trim(),
                  interest: _interest,
                  probability: _prob.round(),
                ),
              ),
              child: const Text('Mark Complete'),
            ),
          ),
        ],
      ),
    );
  }
}
