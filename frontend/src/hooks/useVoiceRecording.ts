import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "recording" | "uploading";

export interface VoiceRecordingResult {
  audioBlob: Blob;
  base64: string;
  duration: number;
}

export interface UseVoiceRecordingOptions {
  maxDuration?: number; // Default: 60 seconds
  onRecordingComplete?: (result: VoiceRecordingResult) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceRecordingReturn {
  recordingState: RecordingState;
  recordingDuration: number;
  waveformData: number[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<VoiceRecordingResult | null>;
  cancelRecording: () => void;
  formatTime: (seconds: number) => string;
  setRecordingState: (state: RecordingState) => void;
}

export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const { maxDuration = 60, onRecordingComplete, onError } = options;

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef<number>(0);

  // Waveform visualization update
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample 20 bars from the frequency data
    const bars = 20;
    const sampledData: number[] = [];
    const step = Math.floor(dataArray.length / bars);

    for (let i = 0; i < bars; i++) {
      const start = i * step;
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[start + j];
      }
      sampledData.push(sum / step / 255); // Normalize to 0-1
    }

    setWaveformData(sampledData);

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Таны хөтөч дуу бичихийг дэмжихгүй байна");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API for waveform
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState("recording");
      setRecordingDuration(0);
      durationRef.current = 0;

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);

        if (durationRef.current >= maxDuration) {
          // Will trigger stopRecording via external call
        }
      }, 1000);

      // Start waveform visualization
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (error) {
      console.error("Error starting recording:", error);

      let errorMessage = "Микрофон руу хандах боломжгүй байна";

      if (error instanceof Error) {
        // Check for specific permission errors
        if (error.name === "NotAllowedError" || error.message.includes("Permission denied")) {
          errorMessage = "Микрофон зөвшөөрөл хэрэгтэй. Браузерийн тохиргоо эсвэл System Settings → Privacy & Security → Microphone хэсгээс зөвшөөрөл өгнө үү.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Микрофон олдсонгүй. Микрофон холбогдсон эсэхийг шалгана уу.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Микрофон ашиглагдаж байна. Өөр програм микрофон ашиглаж байгаа эсэхийг шалгана уу.";
        }
      }

      const err = new Error(errorMessage);
      onError?.(err);
      throw err;
    }
  }, [maxDuration, updateWaveform, onError]);

  const stopRecording = useCallback(async (): Promise<VoiceRecordingResult | null> => {
    if (!mediaRecorderRef.current || recordingState !== "recording") {
      return null;
    }

    // Stop timer and animation
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const duration = durationRef.current;

    return new Promise<VoiceRecordingResult | null>((resolve) => {
      if (!mediaRecorderRef.current) {
        cleanup();
        setRecordingState("idle");
        setWaveformData([]);
        setRecordingDuration(0);
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          setRecordingState("uploading");

          // Create blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;

            const result: VoiceRecordingResult = {
              audioBlob,
              base64,
              duration,
            };

            onRecordingComplete?.(result);
            resolve(result);
          };

          reader.onerror = () => {
            resolve(null);
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error("Error processing audio:", error);
          resolve(null);
        } finally {
          // Cleanup
          cleanup();
          setRecordingState("idle");
          setWaveformData([]);
          setRecordingDuration(0);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [recordingState, cleanup, onRecordingComplete]);

  const cancelRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.onstop = null; // Prevent any callback
      mediaRecorderRef.current.stop();
    }

    cleanup();
    setRecordingState("idle");
    setWaveformData([]);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }, [cleanup]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    recordingState,
    recordingDuration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    formatTime,
    setRecordingState,
  };
}
