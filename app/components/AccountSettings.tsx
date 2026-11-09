"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiCamera,
  FiLock,
  FiTrash2,
  FiSave,
  FiEye,
  FiScissors,
  FiLayers,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { resizeImage } from "@/app/lib/image";
import { removeAndReplaceBackground, WEBSITE_BACKGROUND_COLORS } from "@/app/lib/imageBackground";
import ImageLightboxModal from "@/app/components/ImageLightboxModal";

interface AccountUser {
  id: number;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

export default function AccountSettings() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState<{ success: boolean; text: string } | null>(null);

  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<{ success: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showBgOptions, setShowBgOptions] = useState(false);
  const [selectedBgColor, setSelectedBgColor] = useState("#0f172a");
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgApplied, setBgApplied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/account");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setUser(data);
            setImage(data.image || null);
            setEditName(data.name || "");
          }
        }
      } catch {
        // ignore, profile is non-critical
      }
    };
    refresh();
    const onAccountUpdated = () => refresh();
    window.addEventListener("account:updated", onAccountUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("account:updated", onAccountUpdated);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageStatus(null);
    setBgApplied(false);
    try {
      const dataUrl = await resizeImage(file);
      setImage(dataUrl);
    } catch {
      setImageStatus({ success: false, text: "Could not process that image. Try a different file." });
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveBg = async (bgColor: string) => {
    if (!image || isProcessingBg) return;
    setIsProcessingBg(true);
    setImageStatus(null);
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const file = new File([blob], "avatar.png", { type: blob.type || "image/png" });
      const result = await removeAndReplaceBackground(file, bgColor);
      setImage(result.url);
      setSelectedBgColor(bgColor);
      setBgApplied(true);
    } catch {
      setImageStatus({ success: false, text: "Background removal failed. Please try again." });
    } finally {
      setIsProcessingBg(false);
    }
  };

  const saveImage = async () => {
    if (savingImage) return;
    setSavingImage(true);
    setImageStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (res.ok) {
        setImageStatus({ success: true, text: data.message || "Profile picture saved!" });
        setUser((u) => (u ? { ...u, image: data.user?.image ?? image } : u));
        window.dispatchEvent(new Event("account:updated"));
      } else {
        setImageStatus({ success: false, text: data.message || "Failed to save profile picture." });
      }
    } catch {
      setImageStatus({ success: false, text: "Failed to save profile picture." });
    } finally {
      setSavingImage(false);
    }
  };

  const removeImage = async () => {
    if (savingImage) return;
    setSavingImage(true);
    setImageStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });
      const data = await res.json();
      if (res.ok) {
        setImage(null);
        setImageStatus({ success: true, text: "Profile picture removed." });
        setUser((u) => (u ? { ...u, image: null } : u));
        window.dispatchEvent(new Event("account:updated"));
      } else {
        setImageStatus({ success: false, text: data.message || "Failed to remove profile picture." });
      }
    } catch {
      setImageStatus({ success: false, text: "Failed to remove profile picture." });
    } finally {
      setSavingImage(false);
    }
  };

  const saveName = async () => {
    if (savingName || !editName.trim()) return;
    setSavingName(true);
    setNameStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNameStatus({ success: true, text: data.message || "Name updated!" });
        setUser((u) => (u ? { ...u, name: editName.trim() } : u));
        window.dispatchEvent(new Event("account:updated"));
      } else {
        setNameStatus({ success: false, text: data.message || "Failed to update name." });
      }
    } catch {
      setNameStatus({ success: false, text: "Failed to update name." });
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (savingPassword) return;
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus({ success: false, text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ success: true, text: data.message || "Password updated!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordStatus({ success: false, text: data.message || "Failed to update password." });
      }
    } catch {
      setPasswordStatus({ success: false, text: "Failed to update password." });
    } finally {
      setSavingPassword(false);
    }
  };

  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Profile Picture</h2>
          <p className="text-xs text-slate-500 mt-0.5">Upload a photo to personalize your account.</p>
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0 self-start">
              <div
                onClick={() => image && setShowLightbox(true)}
                className={`size-20 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-white text-2xl font-black ${
                  image ? "cursor-pointer hover:ring-2 hover:ring-[#E91E63] transition-all" : ""
                }`}
                title={image ? "Click to view full screen" : ""}
              >
                {image ? (
                  <img src={image} alt="Profile" className="size-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 size-8 rounded-full bg-[#E91E63] text-white border-2 border-white shadow flex items-center justify-center hover:bg-[#7B1FA2] transition-colors"
                title="Change picture"
              >
                <FiCamera className="size-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{user?.name || "Loading..."}</p>
              <p className="text-xs text-slate-500">{user?.email || ""}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:border-slate-300 transition-colors"
                >
                  <FiCamera className="size-3.5" /> Choose Image
                </button>
                {image && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowLightbox(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors"
                    >
                      <FiEye className="size-3.5" /> View Big Screen
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingBg}
                      onClick={() => setShowBgOptions((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all ${
                        showBgOptions
                          ? "border-[#E91E63] bg-rose-50 text-[#E91E63]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <FiScissors className="size-3.5 text-[#E91E63]" />
                      <span>{isProcessingBg ? "Removing..." : "Remove BG & Theme"}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={saveImage}
                  disabled={savingImage || image === (user?.image || null)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E91E63] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#7B1FA2] transition-colors disabled:opacity-50"
                >
                  {savingImage ? <FiLoader className="size-3.5 animate-spin" /> : <FiSave className="size-3.5" />}
                  Save
                </button>
                {user?.image && (
                  <button
                    onClick={removeImage}
                    disabled={savingImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                  >
                    <FiTrash2 className="size-3.5" /> Remove
                  </button>
                )}
              </div>

              {bgApplied && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                    <FiCheck className="size-3" /> Website Theme Background Applied (Click Save to apply)
                  </span>
                </div>
              )}

              {showBgOptions && image && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <FiLayers className="size-3.5 text-[#E91E63]" /> Match Background to Website Theme:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBgOptions(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      <FiX className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {WEBSITE_BACKGROUND_COLORS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        disabled={isProcessingBg}
                        onClick={() => handleRemoveBg(bg.color)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                          selectedBgColor === bg.color && bgApplied
                            ? "border-[#E91E63] bg-white/10 text-white ring-2 ring-[#E91E63]"
                            : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        <span
                          className="size-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: bg.color === "transparent" ? "transparent" : bg.color }}
                        />
                        <span>{bg.name}</span>
                      </button>
                    ))}
                  </div>
                  {isProcessingBg && (
                    <p className="text-[11px] text-amber-300 animate-pulse font-medium">
                      Segmenting background and applying color composite...
                    </p>
                  )}
                </div>
              )}
              {imageStatus && (
                <p className={`mt-2.5 text-xs font-bold flex items-center gap-1.5 ${imageStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
                  {imageStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
                  {imageStatus.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Display Name</h2>
          <p className="text-xs text-slate-500 mt-0.5">This name is shown across the platform.</p>
        </div>
        <div className="p-5 space-y-3 max-w-md">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10 transition-all"
            placeholder="Your name"
          />
          {nameStatus && (
            <p className={`text-xs font-bold flex items-center gap-1.5 ${nameStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
              {nameStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
              {nameStatus.text}
            </p>
          )}
          <button
            onClick={saveName}
            disabled={savingName || !editName.trim() || editName.trim() === (user?.name || "")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E91E63] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-[#7B1FA2] transition-all disabled:opacity-50"
          >
            {savingName ? <FiLoader className="size-4 animate-spin" /> : <FiSave className="size-4" />}
            Save Name
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FiLock className="size-4 text-slate-400" /> Change Password
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Use at least 6 characters. You will stay signed in.</p>
        </div>
        <div className="p-5 space-y-4 max-w-md">
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10 transition-all"
              placeholder="Enter your current password"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10 transition-all"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10 transition-all"
              placeholder="Repeat the new password"
            />
          </div>
          {passwordStatus && (
            <p className={`text-xs font-bold flex items-center gap-1.5 ${passwordStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
              {passwordStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
              {passwordStatus.text}
            </p>
          )}
          <button
            onClick={changePassword}
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E91E63] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-[#7B1FA2] transition-all disabled:opacity-50"
          >
            {savingPassword ? <FiLoader className="size-4 animate-spin" /> : <FiSave className="size-4" />}
            Update Password
          </button>
        </div>
      </div>

      <ImageLightboxModal
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        imageUrl={image}
        title={user?.name ? `${user.name}'s Profile Picture` : "Profile Picture"}
        subtitle="CoachPlus Academy Profile"
      />
    </div>
  );
}
