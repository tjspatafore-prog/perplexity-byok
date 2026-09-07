"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Globe,
  GraduationCap,
  PenTool,
  Mic,
  MicOff,
  Loader2,
  Users,
  Paperclip,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  X,
  ChevronDown,
  UploadCloud,
} from "lucide-react";
import { FocusMode, ApiKeys, UploadedDocument } from "@/lib/types";
import { ModelSelector } from "./ModelSelector";
import { SwarmTeamSelector } from "./SwarmTeamSelector";

interface SearchBarProps {
  onSearch: (query: string, files?: UploadedDocument[]) => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  focusMode: FocusMode;
  onSelectFocusMode: (mode: FocusMode) => void;
  keys: ApiKeys;
  onOpenSettings: () => void;
  isLoading?: boolean;
  initialValue?: string;
  swarmRoster?: string[];
  onUpdateSwarmRoster?: (roster: string[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || ext === "doc" || ext === "docx" || ext === "txt" || ext === "md" || ext === "rtf") {
    return <FileText className="w-3.5 h-3.5 text-rose-400" />;
  }
  if (ext === "csv" || ext === "tsv" || ext === "xlsx" || ext === "xls") {
    return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (["js", "jsx", "ts", "tsx", "py", "json", "html", "css", "yaml", "yml", "sql"].includes(ext)) {
    return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
  }
  return <File className="w-3.5 h-3.5 text-blue-400" />;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  selectedModelId,
  onSelectModel,
  focusMode,
  onSelectFocusMode,
  keys,
  onOpenSettings,
  isLoading = false,
  initialValue = "",
  swarmRoster = ["gemini-3.8-flash-high", "claude-sonnet-5", "gpt-5.6-sol"],
  onUpdateSwarmRoster,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSwarmSelectorOpen, setIsSwarmSelectorOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!query.trim() && attachedFiles.length === 0) || isLoading || isUploading) return;
    
    // If user uploaded documents without typing a prompt, provide a natural analysis question
    const effectiveQuery = query.trim() || "Please analyze and summarize the uploaded document(s).";
    onSearch(effectiveQuery, attachedFiles);
    setQuery("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Upload and parse documents
  const handleFileProcess = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgressText(`Parsing ${files.length} document${files.length > 1 ? "s" : ""}...`);

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/document/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        setAttachedFiles((prev) => [...prev, ...data.documents]);
      }
    } catch (err: any) {
      console.error("Document parsing error:", err);
      alert(err.message || "Failed to parse uploaded document(s).");
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files);
    }
  };

  // Deepgram Voice Dictation
  const handleStartRecording = async () => {
    if (!keys.deepgram) {
      alert("Deepgram API Key is required for voice input. Please add your key in Settings.");
      onOpenSettings();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Could not access your microphone. Please check browser permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: {
          "x-deepgram-key": keys.deepgram || "",
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transcription failed");
      }

      const data = await res.json();
      if (data.transcript) {
        setQuery((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      alert(err.message || "Failed to transcribe audio with Deepgram.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.md,.csv,.tsv,.json,.js,.ts,.tsx,.py,.html,.css,.xml"
        onChange={(e) => {
          if (e.target.files) handleFileProcess(e.target.files);
        }}
        className="hidden"
      />

      {/* Swarm Team Selector Popover */}
      {isSwarmSelectorOpen && onUpdateSwarmRoster && (
        <SwarmTeamSelector
          isOpen={isSwarmSelectorOpen}
          onClose={() => setIsSwarmSelectorOpen(false)}
          swarmRoster={swarmRoster}
          onUpdateRoster={onUpdateSwarmRoster}
          keys={keys}
          onOpenSettings={onOpenSettings}
        />
      )}

      {/* Main Search Container with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#202222] border rounded-2xl shadow-xl transition-all p-3 space-y-2.5 ${
          isDragging
            ? "border-purple-400 bg-[#252828] ring-2 ring-purple-400/20"
            : "border-[#2e3030] focus-within:border-[#3f4343]"
        }`}
      >
        {/* Drag Overlay Notice */}
        {isDragging && (
          <div className="py-6 flex flex-col items-center justify-center text-purple-300 gap-2 border-2 border-dashed border-purple-400/50 rounded-xl bg-purple-500/10 animate-fadeIn">
            <UploadCloud className="w-8 h-8 animate-bounce" />
            <span className="text-xs font-semibold">Drop documents here (PDF, Word, TXT, CSV, Code)</span>
          </div>
        )}

        {/* Attached Documents Preview Chips */}
        {(attachedFiles.length > 0 || isUploading) && !isDragging && (
          <div className="flex flex-wrap gap-2 pb-1 pt-0.5">
            {attachedFiles.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181919] border border-[#2c2e2e] text-xs text-gray-200 group transition-colors hover:border-[#3d4040]"
              >
                {getFileIcon(doc.name)}
                <span className="font-medium max-w-[140px] sm:max-w-[200px] truncate" title={doc.name}>
                  {doc.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {formatFileSize(doc.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(doc.id)}
                  className="p-0.5 ml-0.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove document"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {isUploading && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadProgressText || "Reading document..."}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Textarea */}
        {!isDragging && (
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Listening to your voice... Click the red mic to stop"
                : isTranscribing
                ? "Deepgram is transcribing audio..."
                : attachedFiles.length > 0
                ? "Ask anything about the uploaded document(s)..."
                : "Ask anything, or drag & drop documents (PDF, Word, Code, Data)..."
            }
            rows={1}
            className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none px-2 py-1 leading-relaxed max-h-48"
          />
        )}

        {/* Bottom Controls Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-[#292b2b]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Focus Modes */}
            <div className="flex items-center bg-[#191a1a] rounded-lg p-0.5 border border-[#2a2c2c] text-xs">
              <button
                type="button"
                onClick={() => onSelectFocusMode("web")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  focusMode === "web"
                    ? "bg-[#252828] text-perplexity-teal font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Search the entire web"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectFocusMode("academic")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  focusMode === "academic"
                    ? "bg-[#252828] text-perplexity-teal font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Search academic and scientific papers"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Academic</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectFocusMode("writing")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  focusMode === "writing"
                    ? "bg-[#252828] text-perplexity-teal font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Reason and write without web search"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Writing</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectFocusMode("swarm")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  focusMode === "swarm"
                    ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Multi-Agent Swarm / Team: Specialized AI agents debate and synthesize together"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Swarm</span>
              </button>
            </div>

            {/* Quick Swarm Team Config Badge (appears when in Swarm mode) */}
            {focusMode === "swarm" && onUpdateSwarmRoster && (
              <button
                type="button"
                onClick={() => setIsSwarmSelectorOpen(!isSwarmSelectorOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-colors"
                title="Configure which AI models form the Swarm Team"
              >
                <span>Team: {swarmRoster.length} models</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isSwarmSelectorOpen ? "rotate-180" : ""}`} />
              </button>
            )}

            {/* Model Selector Dropdown (for non-swarm single-model mode) */}
            {focusMode !== "swarm" && (
              <ModelSelector
                selectedModelId={selectedModelId}
                onSelectModel={onSelectModel}
                keys={keys}
                onOpenSettings={onOpenSettings}
              />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Attach Document Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`p-2 rounded-full bg-[#191a1a] hover:bg-[#252828] text-gray-400 hover:text-purple-300 border border-[#2a2c2c] transition-colors ${
                attachedFiles.length > 0 ? "text-purple-400 border-purple-500/40" : ""
              }`}
              title="Upload document (PDF, Word, Code, Data, Text)"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            {/* Deepgram Voice Input */}
            {isRecording ? (
              <button
                type="button"
                onClick={handleStopRecording}
                className="relative p-2 rounded-full bg-red-500 text-white animate-pulse"
                title="Click to stop recording"
              >
                <span className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />
                <MicOff className="w-4 h-4 relative z-10" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="p-2 rounded-full bg-[#191a1a] hover:bg-[#252828] text-gray-400 hover:text-perplexity-teal border border-[#2a2c2c] transition-colors"
                title="Voice Search (Deepgram Nova-2)"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 text-perplexity-teal animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Send / Search Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={(!query.trim() && attachedFiles.length === 0) || isLoading || isUploading}
              className={`p-2 rounded-full transition-all ${
                (query.trim() || attachedFiles.length > 0) && !isLoading && !isUploading
                  ? focusMode === "swarm"
                    ? "bg-purple-500 text-white hover:bg-purple-600 font-bold shadow-md cursor-pointer"
                    : "bg-perplexity-teal text-[#121313] hover:bg-perplexity-tealHover font-bold shadow-md cursor-pointer"
                  : "bg-[#282a2a] text-gray-500 cursor-not-allowed"
              }`}
              title="Search"
            >
              {isLoading ? (
                <Loader2 className={`w-4 h-4 animate-spin ${focusMode === "swarm" ? "text-white" : "text-perplexity-teal"}`} />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
