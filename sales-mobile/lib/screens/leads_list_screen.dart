import 'package:flutter/material.dart';

import '../models/lead.dart';
import '../services/sales_api.dart';
import 'lead_detail_screen.dart';

class LeadsListScreen extends StatefulWidget {
  const LeadsListScreen({super.key});

  @override
  State<LeadsListScreen> createState() => _LeadsListScreenState();
}

class _LeadsListScreenState extends State<LeadsListScreen> {
  List<Lead> _leads = [];
  String? _error;
  bool _loading = true;
  String _search = '';

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
      final leads = await SalesApi.getLeads();
      setState(() => _leads = leads);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Something went wrong.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Lead> get _filtered {
    if (_search.trim().isEmpty) return _leads;
    final q = _search.toLowerCase();
    return _leads.where((l) {
      return l.ownerName.toLowerCase().contains(q) ||
          (l.pharmacyName ?? '').toLowerCase().contains(q) ||
          (l.phone ?? '').contains(q) ||
          (l.city ?? '').toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Leads')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by name, pharmacy, phone, city',
                prefixIcon: Icon(Icons.search, size: 20),
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                color: Color(0xFFDC2626), size: 40),
            const SizedBox(height: 10),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 14),
            ElevatedButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }

    final list = _filtered;
    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: [
            const SizedBox(height: 120),
            Center(
              child: Text(
                _leads.isEmpty
                    ? 'No leads assigned to you yet.'
                    : 'No leads match your search.',
                style: TextStyle(color: Colors.black.withValues(alpha: 0.4)),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) => _LeadCard(
          lead: list[i],
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => LeadDetailScreen(lead: list[i]),
            ),
          ),
        ),
      ),
    );
  }
}

class _LeadCard extends StatelessWidget {
  final Lead lead;
  final VoidCallback onTap;
  const _LeadCard({required this.lead, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(lead.displayName,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.bold)),
                    if (lead.pharmacyName?.isNotEmpty == true &&
                        lead.ownerName.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 1),
                        child: Text(lead.ownerName,
                            style: TextStyle(
                                fontSize: 12.5,
                                color:
                                    Colors.black.withValues(alpha: 0.5))),
                      ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 13, color: Colors.black38),
                        const SizedBox(width: 3),
                        Text(
                          [lead.city, lead.state]
                                  .where((e) => e?.isNotEmpty == true)
                                  .join(', ')
                              .isEmpty
                              ? '—'
                              : [lead.city, lead.state]
                                  .where((e) => e?.isNotEmpty == true)
                                  .join(', '),
                          style: const TextStyle(
                              fontSize: 12, color: Colors.black54),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _StatusPill(status: lead.status),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String status;
  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = LeadStatus.color(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        LeadStatus.label(status),
        style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }
}
