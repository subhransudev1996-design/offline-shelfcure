import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Thin wrapper around on-device speech recognition. The mic permission and
/// runtime availability are both checked through `initialize()`; failures
/// surface as a typed exception so the UI can show a clear message.
class SpeechException implements Exception {
  final String message;
  SpeechException(this.message);
  @override
  String toString() => message;
}

class SpeechService {
  final _stt = stt.SpeechToText();
  bool _ready = false;

  bool get isAvailable => _ready;

  Future<void> init() async {
    _ready = await _stt.initialize(
      onError: (_) {},
      onStatus: (_) {},
    );
    if (!_ready) {
      throw SpeechException(
        'Speech recognition not available — check microphone permission.',
      );
    }
  }

  /// Start listening. `onResult` fires with the latest partial transcript on
  /// every recognised chunk; `onDone` fires with the final transcript when
  /// the user stops (either via `stop()` or by going silent).
  Future<void> listen({
    required void Function(String transcript) onResult,
    required void Function(String transcript) onDone,
  }) async {
    if (!_ready) await init();
    String last = '';
    await _stt.listen(
      listenOptions: stt.SpeechListenOptions(
        partialResults: true,
        cancelOnError: true,
      ),
      onResult: (r) {
        last = r.recognizedWords;
        onResult(last);
        if (r.finalResult) onDone(last);
      },
    );
  }

  Future<void> stop() async {
    if (_stt.isListening) {
      await _stt.stop();
    }
  }

  bool get isListening => _stt.isListening;
}
