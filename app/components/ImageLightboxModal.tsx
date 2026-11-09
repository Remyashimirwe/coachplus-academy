"use client";

import React, { useEffect, useState } from "react";
import {
  FiX,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiDownload,
  FiMaximize,
} from "react-icons/fi";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
}: ImageLightboxModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => {
    setScale(1);
    setRotation(0);
  };
  const rotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Top Header */}
      <div
        className="w-full max-w-5xl flex items-center justify-between gap-4 py-2 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          {title && (
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>

        {/* Toolbar & Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
          >
            <FiZoomOut className="size-4 sm:size-5" />
          </button>
          <span className="text-xs font-mono text-slate-300 min-w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom In"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
          >
            <FiZoomIn className="size-4 sm:size-5" />
          </button>
          <button
            type="button"
            onClick={rotate}
            title="Rotate"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
          >
            <FiRotateCw className="size-4 sm:size-5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            title="Reset View"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur hidden sm:flex"
          >
            <FiMaximize className="size-4 sm:size-5" />
          </button>
          <a
            href={imageUrl}
            download={title || "image"}
            target="_blank"
            rel="noopener noreferrer"
            title="Download Image"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
          >
            <FiDownload className="size-4 sm:size-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="ml-2 p-2.5 rounded-full bg-[#E91E63] hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-950/50"
          >
            <FiX className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-auto"
        onClick={onClose}
      >
        <div
          className="relative max-h-full max-w-full flex items-center justify-center cursor-default transition-transform duration-200 ease-out select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={title || "Big screen preview"}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* Footer hint */}
      <div
        className="w-full text-center text-xs text-slate-400 py-1 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Click outside or press Escape to close. Use buttons to zoom or rotate.</span>
      </div>
    </div>
  );
}
