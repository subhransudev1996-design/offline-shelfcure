// Basic smoke test for the lead-status helper.
//
// UI widget tests need Supabase to be initialized, so they are deferred to a
// later phase. This keeps `flutter test` green in the meantime.

import 'package:flutter_test/flutter_test.dart';
import 'package:sales_mobile/models/lead.dart';

void main() {
  test('LeadStatus maps known statuses to labels', () {
    expect(LeadStatus.label('demo_done'), 'Demo Done');
    expect(LeadStatus.label('converted'), 'Converted');
  });

  test('LeadStatus falls back to the raw value for unknown statuses', () {
    expect(LeadStatus.label('something_new'), 'something_new');
  });
}
