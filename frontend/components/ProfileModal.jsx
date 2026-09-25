import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../src/context/AuthContext';
import UserAvatar from './UserAvatar';
import toast from 'react-hot-toast';
import {
  IoClose,
  IoCameraOutline,
  IoSparklesOutline,
  IoLockClosedOutline,
  IoCheckmark,
  IoTrashOutline,
  IoColorPaletteOutline,
  IoCloudUploadOutline,
} from 'react-icons/io5';

const AVATAR_PRESETS = [
  {
    id: 'default_male',
    name: 'Short Hair',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&top=shortFlat,shortRound,theCaesar&facialHairProbability=30',
  },
  {
    id: 'default_female',
    name: 'Long Hair',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&top=bob,curvy,longButNotTooLong,straight01&facialHairProbability=0',
  },
  {
    id: 'curly',
    name: 'Curly',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&top=curly,curvy&facialHairProbability=50',
  },
  {
    id: 'bun',
    name: 'Bun',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&top=bun,miaWallace&facialHairProbability=0',
  },
  {
    id: 'adventurer_1',
    name: 'Adventurer',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  },
  {
    id: 'adventurer_2',
    name: 'Explorer',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe',
  },
  {
    id: 'bot_1',
    name: 'Cyber Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo',
  },
  {
    id: 'bot_2',
    name: 'Neon Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel',
  },
];

const ProfileModal = ({ isOpen, onClose }) => {
  const { authUser, updateProfile, genderOptions } = useAuth();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [photoPreview, setPhotoPreview] = useState('');
  const [isCustomPhoto, setIsCustomPhoto] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && authUser) {
      setFullName(authUser.fullName || '');
      setGender(authUser.gender || 'male');
      setPhotoPreview(authUser.profilePhoto || '');
      setIsCustomPhoto(
        Boolean(
          authUser.profilePhoto &&
            !authUser.profilePhoto.includes('api.dicebear.com') &&
            !authUser.profilePhoto.includes('avatar.iran.liara.run')
        )
      );
      setShowAvatarPicker(false);
      setIsDragging(false);
    }
  }, [isOpen, authUser]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute default avatar based on gender and username
  const getDefaultAvatarUrl = (userGender = gender) => {
    const isFemale = userGender === 'female';
    const seed = encodeURIComponent(authUser?.userName || authUser?.fullName || 'user');
    return isFemale
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=bob,bun,curly,curvy,longButNotTooLong,miaWallace,straight01,straight02,straightAndStrand&facialHairProbability=0`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=shortFlat,shortRound,shortWaved,theCaesar,theCaesarAndSidePart,shavedSides&facialHair=beardLight,beardMedium,moustacheMagnum&facialHairProbability=60`;
  };

  const isUsingDefaultAvatar = !isCustomPhoto && (!photoPreview || photoPreview === getDefaultAvatarUrl(gender));

  // Process image file (square crop + JPEG compression)
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = Math.min(size, MAX_SIZE);
        canvas.height = Math.min(size, MAX_SIZE);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          startX,
          startY,
          size,
          size,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        setPhotoPreview(compressedBase64);
        setIsCustomPhoto(true);
        setShowAvatarPicker(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Reset to default avatar
  const handleResetToDefault = () => {
    setPhotoPreview(getDefaultAvatarUrl(gender));
    setIsCustomPhoto(false);
  };

  // Generate random avatar
  const handleGenerateRandomAvatar = () => {
    const styles = ['avataaars', 'adventurer', 'bottts', 'lorelei'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
    setPhotoPreview(newUrl);
    setIsCustomPhoto(false);
  };

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        profilePhoto: photoPreview || getDefaultAvatarUrl(gender),
        gender,
      });

      if (res?.success) {
        onClose();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewUser = {
    ...authUser,
    fullName: fullName || authUser?.fullName,
    gender,
    profilePhoto: photoPreview || getDefaultAvatarUrl(gender),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[460px] bg-[#0f141c] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Edit profile</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage your photo, display name, and details.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Profile Photo Row */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2.5">
              Profile photo
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`p-3.5 rounded-xl border transition flex items-center gap-4 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              {/* Avatar with click-to-upload overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer flex-shrink-0"
                title="Click to upload photo"
              >
                <UserAvatar
                  user={previewUser}
                  size="2xl"
                  showStatus={false}
                  className="rounded-full ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition"
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                  <IoCameraOutline className="w-5 h-5" />
                </div>
              </div>

              {/* Actions & info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <IoCloudUploadOutline className="w-3.5 h-3.5" />
                    Upload image
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker((prev) => !prev)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      showAvatarPicker
                        ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <IoColorPaletteOutline className="w-3.5 h-3.5" />
                    {showAvatarPicker ? 'Hide avatars' : 'Choose avatar'}
                  </button>

                  {!isUsingDefaultAvatar && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Reset to default avatar"
                    >
                      <IoTrashOutline className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 truncate">
                  {isDragging
                    ? 'Drop image here to update'
                    : 'Click avatar or upload button. JPG, PNG or WebP.'}
                </p>
              </div>
            </div>

            {/* Expandable Avatar Presets Drawer */}
            {showAvatarPicker && (
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Select an illustration</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomAvatar}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition cursor-pointer"
                  >
                    <IoSparklesOutline className="w-3.5 h-3.5" />
                    Randomize
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {/* Default Tile */}
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className={`relative p-1 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      isUsingDefaultAvatar
                        ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                    title="Default Avatar"
                  >
                    <img
                      src={getDefaultAvatarUrl(gender)}
                      alt="Default"
                      className="w-10 h-10 rounded-full object-cover bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 truncate max-w-full">Default</span>
                  </button>

                  {/* Preset Avatars */}
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = !isCustomPhoto && photoPreview === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setPhotoPreview(preset.url);
                          setIsCustomPhoto(false);
                        }}
                        className={`relative p-1 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500'
                            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 truncate max-w-full">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Username (Read-only) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username
            </label>
            <div className="flex items-center px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-slate-400">
              <span className="text-slate-500 select-none mr-0.5">@</span>
              <input
                type="text"
                disabled
                value={authUser?.userName || ''}
                className="bg-transparent border-none outline-none text-slate-300 flex-1 cursor-not-allowed select-none text-sm"
              />
              <IoLockClosedOutline className="w-3.5 h-3.5 text-slate-500 ml-2" title="Usernames cannot be changed" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Usernames are permanent and cannot be changed.</p>
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions?.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const newGender = opt.value;
                    setGender(newGender);
                    if (isUsingDefaultAvatar) {
                      setPhotoPreview(getDefaultAvatarUrl(newGender));
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition cursor-pointer ${
                    gender === opt.value
                      ? 'border-indigo-500 bg-indigo-500/20 text-white'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <IoCheckmark className="w-4 h-4" />
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
