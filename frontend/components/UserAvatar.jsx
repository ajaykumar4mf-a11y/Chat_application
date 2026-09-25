import React, { useState } from 'react';

const GRADIENTS = [
  'from-indigo-500 via-indigo-600 to-purple-600',
  'from-violet-500 via-purple-600 to-fuchsia-600',
  'from-cyan-500 via-blue-600 to-indigo-600',
  'from-emerald-500 via-teal-600 to-cyan-600',
  'from-rose-500 via-pink-600 to-purple-600',
  'from-amber-500 via-orange-600 to-rose-600',
];

const getGradient = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

const getInitials = (name = '') => {
  if (!name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const UserAvatar = ({
  user,
  size = 'md',
  showStatus = true,
  isOnline = true,
  className = '',
}) => {
  const photoKey = `${user?._id || ''}_${user?.profilePhoto || ''}`;
  const [prevPhotoKey, setPrevPhotoKey] = useState(photoKey);
  const [imageError, setImageError] = useState(false);

  if (prevPhotoKey !== photoKey) {
    setPrevPhotoKey(photoKey);
    setImageError(false);
  }

  const fullName = user?.fullName || user?.userName || 'User';
  const rawPhoto = user?.profilePhoto;
  const gradient = getGradient(fullName);
  const initials = getInitials(fullName);

  // If the DB has the dead iran.liara.run service (which returns 502 Bad Gateway),
  // automatically resolve to a high-speed, working character avatar from Dicebear
  const resolvePhotoUrl = () => {
    if (!rawPhoto) return null;

    const isFemale =
      user?.gender === 'female' ||
      rawPhoto.includes('/girl') ||
      rawPhoto.includes('gender=female');

    const seed = user?.userName || user?.fullName || 'user';

    if (rawPhoto.includes('avatar.iran.liara.run') || rawPhoto.includes('api.dicebear.com')) {
      if (isFemale) {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&top=bob,bun,curly,curvy,longButNotTooLong,miaWallace,straight01,straight02,straightAndStrand&facialHairProbability=0`;
      } else {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&top=shortFlat,shortRound,shortWaved,theCaesar,theCaesarAndSidePart,shavedSides&facialHair=beardLight,beardMedium,moustacheMagnum&facialHairProbability=60`;
      }
    }
    return rawPhoto;
  };

  const photoUrl = resolvePhotoUrl();
  const shouldShowPhoto = photoUrl && !imageError;

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs sm:text-sm',
    lg: 'w-11 h-11 text-sm sm:text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentStatusSize = statusSizeClasses[size] || statusSizeClasses.md;

  return (
    <div className={`relative flex-shrink-0 select-none ${className}`}>
      {shouldShowPhoto ? (
        <img
          src={photoUrl}
          alt={fullName}
          onError={() => setImageError(true)}
          className={`${currentSizeClass} rounded-full object-cover ring-2 ring-white/10 bg-[#141b2d]`}
        />
      ) : (
        <div
          className={`${currentSizeClass} rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white tracking-wider shadow-inner ring-2 ring-white/10`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${currentStatusSize} rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          } ring-2 ring-[#0c101b]`}
        >
          {isOnline && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60 pointer-events-none" />
          )}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
