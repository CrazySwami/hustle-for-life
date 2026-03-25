import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// --------------- Types ---------------

export interface VoiceState {
  isRecording: boolean;
  isSpeaking: boolean;
}

// --------------- Recording (Speech-to-Text) ---------------

let recording: Audio.Recording | null = null;

/**
 * Request microphone permissions and start recording audio.
 * Returns true if recording started successfully.
 */
export const startListening = async (): Promise<boolean> => {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      console.warn('Microphone permission not granted');
      return false;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );

    recording = newRecording;
    return true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    return false;
  }
};

/**
 * Stop recording and return the audio file URI.
 * In a production app this URI would be sent to a transcription API
 * (Whisper, Deepgram, etc.). For now we return the URI so the caller
 * can integrate whichever STT service they prefer.
 */
export const stopListening = async (): Promise<{ uri: string | null; durationMs: number }> => {
  if (!recording) return { uri: null, durationMs: 0 };

  try {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    const durationMs = status.durationMillis ?? 0;

    recording = null;
    return { uri, durationMs };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    return { uri: null, durationMs: 0 };
  }
};

/**
 * Transcribe audio by sending it to the backend.
 * Falls back to a placeholder if the endpoint is unavailable.
 */
export const transcribeAudio = async (
  uri: string,
  apiUrl: string,
  apiKey?: string,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as unknown as Blob);

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${apiUrl}/api/transcribe`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.text ?? '';
    }

    console.warn('Transcription API returned non-OK status:', response.status);
    return '';
  } catch (error) {
    console.error('Transcription failed:', error);
    return '';
  }
};

// --------------- Text-to-Speech ---------------

/**
 * Read text aloud using the device TTS engine.
 */
export const speakResponse = (text: string): void => {
  // Strip markdown-style formatting for cleaner speech
  const cleaned = text
    .replace(/[*_`#]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ');

  Speech.speak(cleaned, {
    language: 'en-US',
    pitch: 1.0,
    rate: Platform.OS === 'ios' ? 0.52 : 0.9,
  });
};

/**
 * Check if TTS is currently speaking.
 */
export const isSpeaking = async (): Promise<boolean> => {
  return Speech.isSpeakingAsync();
};

/**
 * Stop any ongoing TTS playback.
 */
export const stopSpeaking = (): void => {
  Speech.stop();
};

/**
 * Check if we currently have an active recording.
 */
export const isRecording = (): boolean => {
  return recording !== null;
};
