/// App-wide configuration for the ShelfCure Sales mobile app.
class AppConfig {
  /// Supabase project (shared with the web admin panel). The anon key is a
  /// public client key — safe to ship in the app.
  static const String supabaseUrl = 'https://xznwdmfjkiwtkegsdxoo.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bndkbWZqa2l3dGtlZ3NkeG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDgyNDQsImV4cCI6MjA4NDgyNDI0NH0.NmjbENkNpnD_Vi1fat8l0HtJDOJbqEXLyDLYCs7XFP4';

  /// Base URL for the /api/sales/* backend.
  ///
  /// Default `10.0.2.2:3000` = the host machine as seen from the Android
  /// emulator (i.e. `next dev` on your PC). Override for a real device or
  /// production:
  ///   flutter run --dart-define=API_BASE=https://your-domain.com
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://10.0.2.2:3000',
  );
}
