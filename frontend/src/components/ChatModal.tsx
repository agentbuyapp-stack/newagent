"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { type Message, type Order } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
// Upload image via backend API
async function uploadImageToCloudinary(base64Data: string, apiClient: any): Promise<{ url: string }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const headers = await apiClient.getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/upload-image`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Data }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to upload image");
  }
  
  return response.json();
}

interface ChatModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ order, isOpen, onClose }: ChatModalProps) {
  const { user: clerkUser } = useUser();
  const apiClient = useApiClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Get current user ID from database
  useEffect(() => {
    if (isOpen && clerkUser) {
      apiClient.getMe().then((user) => {
        setCurrentUserId(user.id);
      }).catch(console.error);
    }
  }, [isOpen, clerkUser, apiClient]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!isOpen) return;

    const pollMessages = async () => {
      try {
        const newMessages = await apiClient.getMessages(order.id);
        setMessages(newMessages);
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    // Load initial messages
    setLoading(true);
    pollMessages().finally(() => setLoading(false));

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(pollMessages, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, order.id, apiClient]);

  // Manual scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is at bottom of chat
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        // Show button if not at the very bottom (with 100px buffer)
        setShowScrollToBottom(scrollHeight - scrollTop > clientHeight + 100);
      }
    };

    const currentContainer = messagesContainerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [messages]); // Re-evaluate when messages change

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !fileInputRef.current?.files?.[0]) || sending) return;

    try {
      setSending(true);
      let imageUrl: string | undefined;

      // Upload image if selected
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("Зураг хэт том байна. Дээд тал нь 5MB байна.");
          setSending(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        
        setUploadingImage(true);
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const result = await uploadImageToCloudinary(base64, apiClient);
            imageUrl = result.url;
            
            // Send message with image
            const message = await apiClient.sendMessage(order.id, {
              text: newMessage.trim() || undefined,
              imageUrl,
            });
            
            setMessages((prev) => [...prev, message]);
            setNewMessage("");
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (error) {
            console.error("Error uploading image:", error);
            alert("Зураг илгээхэд алдаа гарлаа");
          } finally {
            setUploadingImage(false);
            setSending(false);
          }
        };
        
        reader.readAsDataURL(file);
        return;
      }

      // Send text message
      const message = await apiClient.sendMessage(order.id, {
        text: newMessage.trim(),
      });
      
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(error.message || "Мессеж илгээхэд алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Чат - {order.productName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          {loading ? (
            <div className="text-center text-gray-500">Ачааллаж байна...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">Мессеж байхгүй байна</div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {message.text && (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    )}
                    {message.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={(() => {
                            // Add Cloudinary transformation if it's a Cloudinary URL
                            const url = message.imageUrl;
                            if (url.includes('cloudinary.com')) {
                              // Check if transformation already exists
                              if (url.includes('/upload/')) {
                                const parts = url.split('/upload/');
                                if (parts.length === 2) {
                                  // Add transformation: w_600,h_600,c_limit,q_auto
                                  return `${parts[0]}/upload/w_600,h_600,c_limit,q_auto,f_auto/${parts[1]}`;
                                }
                              }
                            }
                            return url;
                          })()}
                          alt="Chat image"
                          className="max-w-xs max-h-64 w-auto h-auto rounded cursor-zoom-in object-contain"
                          style={{ maxWidth: "300px", maxHeight: "256px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const img = e.currentTarget;
                            const isZoomed = img.dataset.zoomed === "true";
                            
                            if (isZoomed) {
                              // Zoom out - return to normal size immediately
                              img.style.position = "";
                              img.style.top = "";
                              img.style.left = "";
                              img.style.width = "";
                              img.style.height = "";
                              img.style.zIndex = "";
                              img.style.cursor = "";
                              img.style.backgroundColor = "";
                              img.style.transform = "";
                              img.style.padding = "";
                              img.style.borderRadius = "";
                              img.style.maxWidth = "300px";
                              img.style.maxHeight = "256px";
                              img.style.transition = "";
                              img.style.boxShadow = "";
                              img.style.filter = "";
                              img.dataset.zoomed = "false";
                              
                              // Restore thumbnail URL
                              const url = message.imageUrl;
                              if (url) {
                                if (url.includes('cloudinary.com')) {
                                  if (url.includes('/upload/')) {
                                    const parts = url.split('/upload/');
                                    if (parts.length === 2) {
                                      img.src = `${parts[0]}/upload/w_600,h_600,c_limit,q_auto,f_auto/${parts[1]}`;
                                    }
                                  }
                                } else {
                                  img.src = url;
                                }
                              }
                            } else {
                              // Zoom in - full display immediately
                              const originalSrc = message.imageUrl;
                              
                              if (!originalSrc) return;
                              
                              // Use original image URL for zoom (without size limit)
                              const tempImg = new Image();
                              tempImg.crossOrigin = "anonymous";
                              tempImg.onload = () => {
                                const naturalWidth = tempImg.naturalWidth;
                                const naturalHeight = tempImg.naturalHeight;
                                const aspectRatio = naturalWidth / naturalHeight;
                                
                                // Calculate optimal display size (max 90vw x 90vh)
                                const maxWidth = window.innerWidth * 0.9;
                                const maxHeight = window.innerHeight * 0.9;
                                
                                let displayWidth = maxWidth;
                                let displayHeight = maxWidth / aspectRatio;
                                
                                if (displayHeight > maxHeight) {
                                  displayHeight = maxHeight;
                                  displayWidth = maxHeight * aspectRatio;
                                }
                                
                                // Set image source
                                img.src = originalSrc;
                                
                                img.style.position = "fixed";
                                img.style.top = "50%";
                                img.style.left = "50%";
                                img.style.transform = "translate(-50%, -50%)";
                                img.style.width = `${displayWidth}px`;
                                img.style.height = `${displayHeight}px`;
                                img.style.maxWidth = "90vw";
                                img.style.maxHeight = "90vh";
                                img.style.objectFit = "contain";
                                img.style.zIndex = "10000";
                                img.style.cursor = "zoom-out";
                                img.style.backgroundColor = "transparent";
                                img.style.padding = "0";
                                img.style.borderRadius = "8px";
                                img.style.transition = "";
                                img.style.boxShadow = "0 20px 60px rgba(0,0,0,0.8)";
                                img.style.filter = "";
                                img.dataset.zoomed = "true";
                              };
                              tempImg.onerror = () => {
                                // Fallback if image fails to load
                                img.src = originalSrc;
                                img.style.position = "fixed";
                                img.style.top = "50%";
                                img.style.left = "50%";
                                img.style.transform = "translate(-50%, -50%)";
                                img.style.width = "90vw";
                                img.style.height = "90vh";
                                img.style.maxWidth = "90vw";
                                img.style.maxHeight = "90vh";
                                img.style.objectFit = "contain";
                                img.style.zIndex = "10000";
                                img.style.cursor = "zoom-out";
                                img.style.backgroundColor = "transparent";
                                img.style.padding = "0";
                                img.style.borderRadius = "8px";
                                img.style.transition = "";
                                img.style.boxShadow = "0 20px 60px rgba(0,0,0,0.8)";
                                img.style.filter = "";
                                img.dataset.zoomed = "true";
                              };
                              tempImg.src = originalSrc;
                            }
                          }}
                        />
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                      {new Date(message.createdAt).toLocaleTimeString("mn-MN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10 flex items-center justify-center"
              aria-label="Доошоо гүйлгэх"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={() => {
                // Trigger send if image is selected
                if (fileInputRef.current?.files?.[0]) {
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || sending}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              {uploadingImage ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Мессеж бичнэ үү..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
                disabled={sending || uploadingImage}
              />
              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !fileInputRef.current?.files?.[0]) || sending || uploadingImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Илгээх"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

