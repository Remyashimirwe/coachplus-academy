"use client";

import { useState } from "react";
import { FaWhatsapp, FaTimes, FaPhoneAlt } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const phoneNumber = "+250780000000"; // Placeholder

  const handleSend = () => {
    if (!message.trim()) return;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setMessage("");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      <a
        href={`tel:${phoneNumber}`}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-blue-700 active:scale-95"
        aria-label="Call us"
      >
        <FaPhoneAlt className="h-6 w-6" />
      </a>

      <div className="flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="mb-4 w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
            >
              <div className="bg-[#25D366] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                      <FaWhatsapp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">CoachPlus Academy</p>
                      <p className="text-xs text-white/80">Typically replies in a few hours</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 transition-colors hover:bg-black/10"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4">
                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
                  <p className="text-sm text-slate-600">
                    Hi there! 👋<br />
                    How can we help you today?
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full resize-none rounded-xl border-none bg-slate-100 p-3 text-sm focus:ring-2 focus:ring-[#25D366]"
                  rows={3}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white transition-all hover:bg-[#128C7E] disabled:opacity-50"
                >
                  <FiSend className="h-4 w-4" />
                  Send to WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen ? "bg-slate-200 text-slate-600" : "bg-[#25D366] text-white"
          }`}
          aria-label="Contact us on WhatsApp"
        >
          {isOpen ? <FaTimes className="h-6 w-6" /> : <FaWhatsapp className="h-8 w-8" />}
        </button>
      </div>
    </div>
  );
}
