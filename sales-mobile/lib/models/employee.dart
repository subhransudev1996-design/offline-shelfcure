/// A picker entry for "Conducted by" when scheduling a demo.
class Employee {
  final String id;
  final String fullName;
  final String role;

  Employee({required this.id, required this.fullName, required this.role});

  factory Employee.fromJson(Map<String, dynamic> j) => Employee(
        id: j['id'] as String,
        fullName: (j['full_name'] ?? '') as String,
        role: (j['role'] ?? 'field_sales') as String,
      );

  String get roleLabel => role == 'demo_team' ? 'Demo Team' : 'Field Sales';
}
