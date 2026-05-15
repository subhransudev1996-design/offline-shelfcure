/// App-wide configuration for the ShelfCure Sales mobile app.
class AppConfig {
  /// Supabase project (shared with the web admin panel). The anon key is a
  /// public client key — safe to ship in the app.
  static const String supabaseUrl = 'https://xznwdmfjkiwtkegsdxoo.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bndkbWZqa2l3dGtlZ3NkeG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDgyNDQsImV4cCI6MjA4NDgyNDI0NH0.NmjbENkNpnD_Vi1fat8l0HtJDOJbqEXLyDLYCs7XFP4';

  /// Base URL for the /api/sales/* backend.
  ///
  /// Defaults to the deployed Vercel URL so the app works on real devices
  /// out of the box. Override for local dev against `next dev`:
  ///   flutter run --dart-define=API_BASE=http://10.0.2.2:3000   # Android emulator
  ///   flutter run --dart-define=API_BASE=http://192.168.1.5:3000 # real device on LAN
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'https://offline-shelfcure.vercel.app',
  );
}
