import 'package:geolocator/geolocator.dart';

/// Thrown when we can't get a GPS fix. `message` is safe to show the user.
class LocationException implements Exception {
  final String message;
  LocationException(this.message);
  @override
  String toString() => message;
}

/// Thin wrapper around `geolocator` with friendlier error messages.
class LocationService {
  /// Ensure GPS is on and permission is granted, then return the current fix.
  static Future<Position> currentPosition() async {
    final serviceOn = await Geolocator.isLocationServiceEnabled();
    if (!serviceOn) {
      throw LocationException(
          'Location service is off. Turn on GPS and try again.');
    }

    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied) {
      throw LocationException('Location permission denied.');
    }
    if (perm == LocationPermission.deniedForever) {
      throw LocationException(
          'Location permission permanently denied — enable it in app settings.');
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 15),
      ),
    );
  }
}
