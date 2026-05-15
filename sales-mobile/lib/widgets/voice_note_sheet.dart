import 'dart:async';

import 'package:flutter/material.dart';

import '../services/speech_service.dart';
import '../theme.dart';

/// Result of a successful voice-note capture.
class VoiceNoteResult {
  final String transcript;
  final int durationSeconds;
  VoiceNoteResult({required this.transcript, required this.durationSeconds});
}

/// Bottom sheet that records a voice note via on-device speech-to-text and
/// lets the user edit the transcript before saving. No audio leaves the
/// device — only the final text is returned via `Navigator.pop`.
class VoiceNoteSheet extends StatefulWidget {
  const VoiceNoteSheet({super.key});

  @override
  State<VoiceNoteSheet> createState() => _VoiceNoteSheetState();
}

class _VoiceNoteSheetState extends State<VoiceNoteSheet> {
  final _speech = SpeechService();
  final _editing = TextEditingController();

  bool _initFailed = false;
  String? _initError;
  bool _isListening = false;
  String _interim = '';
  DateTime? _startedAt;
  int _durationSec = 0;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      await _speech.init();
    } on SpeechException catch (e) {
      setState(() {
        _initFailed = true;
        _initError = e.message;
      });
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _speech.stop();
    _editing.dispose();
    super.dispose();
  }

  Future<void> _toggle() async {
    if (_isListening) {
      await _speech.stop();
      _stopListening(finalText: _interim);
      return;
    }
    try {
      setState(() {
        _isListening = true;
        _interim = '';
        _startedAt = DateTime.now();
        _durationSec = 0;
      });
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (_startedAt != null && mounted) {
          setState(() =>
              _durationSec = DateTime.now().difference(_startedAt!).inSeconds);
        }
      });
      await _speech.listen(
        onResult: (t) => setState(() => _interim = t),
        onDone: (t) => _stopListening(finalText: t),
      );
    } on SpeechException catch (e) {
      setState(() {
        _isListening = false;
        _initError = e.message;
      });
    }
  }

  void _stopListening({required String finalText}) {
    _ticker?.cancel();
    if (!mounted) return;
    setState(() {
      _isListening = false;
      if (finalText.trim().isNotEmpty) {
        // Append to the editing field, preserving anything the user typed.
        final existing = _editing.text.trim();
        _editing.text =
            existing.isEmpty ? finalText.trim() : '$existing ${finalText.trim()}';
        _editing.selection = TextSelection.collapsed(offset: _editing.text.length);
      }
      _interim = '';
    });
  }

  void _save() {
    final text = _editing.text.trim();
    if (text.isEmpty) return;
    Navigator.pop(
      context,
      VoiceNoteResult(transcript: text, durationSeconds: _durationSec),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16, 18, 16, MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Voice Note',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            _initFailed
                ? (_initError ?? 'Speech not available')
                : 'Tap the mic, speak, tap again to stop. Edit the text before saving.',
            style: TextStyle(
                fontSize: 12, color: Colors.black.withValues(alpha: 0.5)),
          ),
          const SizedBox(height: 14),
          // Big mic button
          Center(
            child: GestureDetector(
              onTap: _initFailed ? null : _toggle,
              child: Container(
                width: 78,
                height: 78,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isListening
                      ? const Color(0xFFEF4444)
                      : AppColors.navy,
                  boxShadow: [
                    if (_isListening)
                      BoxShadow(
                        color: const Color(0xFFEF4444).withValues(alpha: 0.4),
                        blurRadius: 22,
                        spreadRadius: 4,
                      ),
                  ],
                ),
                child: Icon(
                    _isListening ? Icons.stop : Icons.mic,
                    color: Colors.white,
                    size: 32),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              _isListening
                  ? 'Listening… ${_formatDur(_durationSec)}'
                  : (_durationSec > 0 ? _formatDur(_durationSec) : 'Tap to start'),
              style: TextStyle(
                  fontSize: 12.5,
                  color: _isListening
                      ? const Color(0xFFEF4444)
                      : Colors.black.withValues(alpha: 0.55)),
            ),
          ),
          const SizedBox(height: 14),
          if (_isListening && _interim.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(_interim,
                  style: const TextStyle(fontSize: 13, height: 1.35)),
            ),
          const SizedBox(height: 10),
          TextField(
            controller: _editing,
            maxLines: 5,
            minLines: 3,
            decoration: const InputDecoration(
              labelText: 'Transcript',
              hintText: 'Edit before saving…',
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _editing.text.trim().isEmpty ? null : _save,
              child: const Text('Save Voice Note'),
            ),
          ),
        ],
      ),
    );
  }

  static String _formatDur(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}
