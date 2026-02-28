/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useCallback } from "react";
import { useApiClient } from "@/lib/useApiClient";

interface NewOrderFormProps {
  onSuccess: () => void;
}

export default function NewOrderForm({ onSuccess }: NewOrderFormProps) {
  const apiClient = useApiClient();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUploading, setAudioUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Image handling ──
  const processFiles = useCallback((files: FileList | File[]) => {
    const remaining = 3 - imagePreviews.length;
    if (remaining <= 0) return;

    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreviews((p) => [...p, dataUrl]);
        setImageUrls((p) => [...p, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  }, [imagePreviews.length]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImagePreviews((p) => p.filter((_, i) => i !== index));
    setImageUrls((p) => p.filter((_, i) => i !== index));
  };

  // ── Audio recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setAudioUploading(true);
          try {
            const result = await apiClient.uploadAudio(base64);
            setAudioUrl(result.url);
          } catch {
            setError("Аудио upload амжилтгүй боллоо");
          } finally {
            setAudioUploading(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      setError("Микрофон ашиглах зөвшөөрөл өгнө үү");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const removeAudio = () => {
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!productName.trim()) {
      setError("Барааны мэдээлэл оруулна уу");
      setLoading(false);
      return;
    }

    try {
      await apiClient.createOrder({
        productName: productName.trim(),
        description: description.trim(),
        imageUrls,
        ...(audioUrl ? { audioUrl } : {}),
      });

      setSuccess(true);
      setProductName("");
      setDescription("");
      setImageUrls([]);
      setImagePreviews([]);
      setAudioUrl(null);
      setRecordingTime(0);
      onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[13px] sm:text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[13px] sm:text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Захиалга амжилттай үүслээ!
        </div>
      )}

      {/* ── Product Name ── */}
      <div>
        <label className="block text-[13px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Барааны мэдээлэл</label>
        <input
          type="text"
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all placeholder:text-gray-400"
          placeholder="Барааны нэр эсвэл линк"
        />
      </div>

      {/* ── Description ── */}
      <div>
        <label className="block text-[13px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Тайлбар</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none placeholder:text-gray-400 sm:[rows:3]"
          placeholder="Өнгө, хэмжээ, тоо ширхэг, линк гэх мэт..."
        />
      </div>

      {/* ── Image & Audio row ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Image Upload */}
        <div>
          <label className="block text-[13px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
            Зураг <span className="font-normal text-gray-400">({imagePreviews.length}/3)</span>
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => imagePreviews.length < 3 && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
              ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"}
              ${imagePreviews.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1.5 sm:p-2">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square group">
                    <img src={preview} alt={`Зураг ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 3 && (
                  <div className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 sm:py-6 px-3 sm:px-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1.5 sm:mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 text-center">Зураг <span className="text-blue-500 font-medium">сонгох</span></p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              onChange={handleImageChange} className="hidden" />
          </div>
        </div>

        {/* Audio Record */}
        <div>
          <label className="block text-[13px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Дуут тайлбар</label>
          <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl">
            {audioUrl ? (
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] sm:text-sm font-medium text-gray-700">Бэлэн</p>
                  <audio src={audioUrl} controls className="w-full h-7 sm:h-8 mt-1" />
                </div>
                <button type="button" onClick={removeAudio}
                  className="p-1 sm:p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ) : audioUploading ? (
              <div className="flex flex-col items-center justify-center py-4 sm:py-6 px-3 sm:px-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-1.5 sm:mb-2" />
                <p className="text-[11px] sm:text-xs text-gray-500">Хадгалж байна...</p>
              </div>
            ) : isRecording ? (
              <div className="flex flex-col items-center justify-center py-3.5 sm:py-5 px-3 sm:px-4">
                <div className="relative mb-2 sm:mb-3">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-100 text-red-600 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <button type="button" onClick={stopRecording}
                  className="text-[11px] sm:text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                  Зогсоох
                </button>
              </div>
            ) : (
              <button type="button" onClick={startRecording}
                className="w-full flex flex-col items-center justify-center py-4 sm:py-6 px-3 sm:px-4 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1.5 sm:mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500">Дарж <span className="text-blue-500 font-medium">бичих</span></p>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={loading || audioUploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all font-semibold text-[13px] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Илгээж байна...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Захиалга илгээх
          </>
        )}
      </button>
    </form>
  );
}
