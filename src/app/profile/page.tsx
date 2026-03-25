'use client';

import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api';

interface Profile {
  id: number;
  image: string;
  full_name: string;
  bio: string;
  about: string;
  country: string;
  twitter: string;
  linkedin: string;
  is_author: boolean;
  is_premium: boolean;
}

function getProfileImageUrl(image: string): string {
  if (!image) return '/default-user.jpg';
  if (image.startsWith('http')) return image;
  return `${API_BASE}/media/${image}`;
}

// Utility to crop and convert to File
async function getCroppedImg(imageSrc: string, crop: Area): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  const size = Math.max(crop.width, crop.height);
  canvas.width = size;
  canvas.height = size;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas is empty'));
      resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', error => reject(error));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedLogo, setAnimatedLogo] = useState(false);

  useEffect(() => {
    setAnimatedLogo(localStorage.getItem('animated_logo') === 'true');
  }, []);

  const toggleAnimatedLogo = () => {
    const next = !animatedLogo;
    setAnimatedLogo(next);
    localStorage.setItem('animated_logo', String(next));
    window.dispatchEvent(new Event('animated_logo_changed'));
  };
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    about: '',
    country: '',
    twitter: '',
    linkedin: '',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
const [cropModalOpen, setCropModalOpen] = useState(false);
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
const [croppedImage, setCroppedImage] = useState<File | null>(null);
const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(API_BASE + '/api/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        about: data.about || '',
        country: data.country || '',
        twitter: data.twitter || '',
        linkedin: data.linkedin || '',
      });
      setErrorMsg(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMsg('Failed to load profile. Please try again.');
      toast.error('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setRawImageUrl(URL.createObjectURL(target.files[0]));
        setCropModalOpen(true);
        setImageFile(target.files[0]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (croppedImage) {
        form.append('image', croppedImage);
      }
      setIsSaving(true);
      const response = await fetch(API_BASE + '/api/profile/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      toast.success('Profile updated!');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMsg('Failed to update profile. Please try again.');
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-darkBlue/30 rounded-2xl shadow-xl p-8 animate-pulse border border-blue/20">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-blue/20" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-blue/20 rounded w-1/2" />
              <div className="h-4 bg-blue/10 rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 bg-blue/10 rounded w-2/3" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red/10 text-red rounded-2xl shadow-xl p-8 text-center border border-red/20">
          <p className="text-lg font-semibold mb-2">{errorMsg}</p>
          <button
            className="btn-secondary mt-4"
            onClick={() => { setIsLoading(true); setErrorMsg(null); fetchProfile(); }}
            aria-label="Retry loading profile"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-grey mb-4">Failed to load profile</p>
          <button
            onClick={fetchProfile}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-md border border-destructive/20 hover:bg-destructive/10 transition-colors text-destructive"
          >
            Log Out
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center overflow-hidden">
                {croppedImage ? (
                  <img
                    src={URL.createObjectURL(croppedImage)}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : profile && profile.image ? (
                  <img
                    src={getProfileImageUrl(profile.image)}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue">
                    {profile.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile.full_name || 'No name set'}</h2>
                <p className="text-muted-foreground">
                  {profile.is_premium ? 'Premium Member' : 'Free Member'}
                  {profile.is_author && ' • Author'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Edit profile form">
              <div>
                <label htmlFor="image" className="form-label">Profile Image</label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="form-input"
                  aria-label="Upload profile image"
                />
                {/* Cropper Modal */}
                {cropModalOpen && rawImageUrl && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-background border border-blue/20 rounded-lg shadow-lg p-6 relative w-[90vw] max-w-md">
                      <h3 className="text-lg font-semibold mb-4">Crop your profile image</h3>
                      <div className="relative w-full h-64 bg-darkBlue/30 rounded overflow-hidden">
                        <Cropper
                          image={rawImageUrl}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                        />
                      </div>
                      <div className="flex items-center mt-4">
                        <label className="mr-2">Zoom:</label>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.01}
                          value={zoom}
                          onChange={e => setZoom(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex justify-end mt-6 space-x-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setCropModalOpen(false);
                            setRawImageUrl(null);
                            setImageFile(null);
                          }}
                          aria-label="Cancel cropping"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={async () => {
                            if (!croppedAreaPixels || !rawImageUrl) return;
                            const cropped = await getCroppedImg(rawImageUrl, croppedAreaPixels);
                            setCroppedImage(cropped);
                            setCropModalOpen(false);
                          }}
                          aria-label="Crop and save image"
                        >
                          Crop & Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="full_name" className="form-label">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                  aria-required="true"
                  aria-label="Full name"
                />
              </div>

              <div>
                <label htmlFor="bio" className="form-label">Short Bio</label>
                <input
                  id="bio"
                  name="bio"
                  type="text"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="A brief description about yourself"
                  aria-label="Short bio"
                />
              </div>

              <div>
                <label htmlFor="about" className="form-label">About</label>
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  className="form-input min-h-[100px]"
                  placeholder="Tell us more about yourself"
                  aria-label="About"
                />
              </div>

              <div>
                <label htmlFor="country" className="form-label">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  className="form-input"
                  aria-label="Country"
                />
              </div>

              <div>
                <label htmlFor="twitter" className="form-label">Twitter</label>
                <input
                  id="twitter"
                  name="twitter"
                  type="text"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="@username"
                  aria-label="Twitter"
                />
              </div>

              <div>
                <label htmlFor="linkedin" className="form-label">LinkedIn</label>
                <input
                  id="linkedin"
                  name="linkedin"
                  type="text"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your LinkedIn profile URL"
                  aria-label="LinkedIn"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                  disabled={isSaving}
                  aria-busy={isSaving}
                  aria-label="Save profile changes"
                >
                  {isSaving && (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                <p>{profile.bio || 'No bio added yet'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">About</h3>
                <p>{profile.about || 'No about information added yet'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Country</h3>
                <p>{profile.country || 'No country specified'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Social Links</h3>
                <div className="space-y-2">
                  {profile.twitter && (
                    <a
                      href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue hover:underline block"
                      aria-label={`Twitter profile: ${profile.twitter}`}
                    >
                      Twitter: {profile.twitter}
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue hover:underline block"
                      aria-label="LinkedIn profile"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                  {!profile.twitter && !profile.linkedin && (
                    <p className="text-muted-foreground">No social links added</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Animated logo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Show the animated GIF version of the logo in the navbar</p>
            </div>
            <button
              type="button"
              onClick={toggleAnimatedLogo}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${animatedLogo ? 'bg-blue' : 'bg-muted'}`}
              aria-pressed={animatedLogo}
              aria-label="Toggle animated logo"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${animatedLogo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
