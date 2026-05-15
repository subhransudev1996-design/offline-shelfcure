/// The signed-in sales employee, from /api/sales/auth/me.
class SalesProfile {
  final String id;
  final String fullName;
  final String? email;
  final String? phone;
  final String role; // 'admin' | 'field_sales' | 'demo_team'
  final bool isActive;

  SalesProfile({
    required this.id,
    required this.fullName,
    this.email,
    this.phone,
    required this.role,
    required this.isActive,
  });

  factory SalesProfile.fromJson(Map<String, dynamic> j) => SalesProfile(
        id: j['id'] as String,
        fullName: (j['full_name'] ?? '') as String,
        email: j['email'] as String?,
        phone: j['phone'] as String?,
        role: (j['role'] ?? 'field_sales') as String,
        isActive: (j['is_active'] ?? true) as bool,
      );

  String get roleLabel {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'demo_team':
        return 'Demo Team';
      default:
        return 'Field Sales';
    }
  }
}
