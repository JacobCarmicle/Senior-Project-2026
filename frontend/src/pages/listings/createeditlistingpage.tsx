import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../api/errors";
import { createListing, getListing, updateListing, uploadListingImages } from "../../api/listings";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      "#2d2d2d",
  card:    "#1a1a1a",
  text:    "#e5e5e5",
  muted:   "#9ca3af",
  border:  "#404040",
  accent:  "#22c55e",
  accent2: "#16a34a",
  danger:  "#ef4444",
  surface: "#2d2d2d",
  input:   "#252525",
  error:   "#ef4444",
};

const CATEGORIES = [
  "Electronics", "Automotive", "Furniture",
  "Clothing", "Sports", "Books", "Toys", "Other",
];

const MAX_IMAGES    = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

// ── Types ─────────────────────────────────────────────────────────────────────
interface ImageFile {
  id: string;
  file?: File;
  preview: string;   // object URL or existing URL
  isPrimary: boolean;
  isExisting?: boolean;
}

interface FormData {
  title:       string;
  description: string;
  price:       string;
  category:    string;
  location:    string;
  condition:   string;
}

interface FormErrors {
  title?:       string;
  description?: string;
  price?:       string;
  category?:    string;
  location?:    string;
  condition?:   string;
  images?:      string;
}

// ── Shared Input Style ────────────────────────────────────────────────────────
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: T.input,
    color: T.text,
    border: `1px solid ${hasError ? T.error : T.border}`,
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "Arial, sans-serif",
    transition: "border-color 0.2s",
  };
}

// ── Field Label ───────────────────────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: T.muted, marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {text}{required && <span style={{ color: T.accent, marginLeft: "3px" }}>*</span>}
    </label>
  );
}

// ── Error Message ─────────────────────────────────────────────────────────────
function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: "12px", color: T.error, marginTop: "5px", fontWeight: 600 }}>⚠ {msg}</div>;
}

// ── Image Upload Zone ─────────────────────────────────────────────────────────
function ImageUploadZone({ images, onAdd, onRemove, onSetPrimary, error }: {
  images: ImageFile[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) onAdd(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Drop Zone */}
      {images.length < MAX_IMAGES && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? T.accent : error ? T.error : T.border}`,
            borderRadius: "12px",
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(34,197,94,0.05)" : T.input,
            transition: "all 0.2s",
            marginBottom: images.length > 0 ? "14px" : "0",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: "14px", marginBottom: "4px" }}>
            Click or drag to upload images
          </div>
          <div style={{ fontSize: "12px", color: T.muted }}>
            PNG, JPG, WEBP · Max 5MB per image · Up to {MAX_IMAGES} images
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            style={{ display: "none" }}
            onChange={e => e.target.files && onAdd(e.target.files)}
          />
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {images.map(img => (
            <div key={img.id} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: `2px solid ${img.isPrimary ? T.accent : T.border}`, background: "#222", aspectRatio: "1" }}>
              <img src={img.preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Primary badge */}
              {img.isPrimary && (
                <div style={{ position: "absolute", top: "6px", left: "6px", background: T.accent, color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                  PRIMARY
                </div>
              )}

              {/* Actions overlay */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", display: "flex", gap: "4px", padding: "6px" }}>
                {!img.isPrimary && (
                  <button onClick={() => onSetPrimary(img.id)} style={{ flex: 1, fontSize: "10px", fontWeight: 700, padding: "4px", borderRadius: "5px", border: `1px solid rgba(34,197,94,0.4)`, background: "rgba(34,197,94,0.15)", color: T.accent, cursor: "pointer" }}>
                    Set Primary
                  </button>
                )}
                <button onClick={() => onRemove(img.id)} style={{ flex: 1, fontSize: "10px", fontWeight: 700, padding: "4px", borderRadius: "5px", border: `1px solid rgba(239,68,68,0.4)`, background: "rgba(239,68,68,0.15)", color: T.danger, cursor: "pointer" }}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {images.length < MAX_IMAGES && (
            <div onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${T.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", aspectRatio: "1", background: T.input, color: T.muted, fontSize: "24px" }}>
              +
            </div>
          )}
        </div>
      )}

      <ErrorMsg msg={error} />
      <div style={{ fontSize: "12px", color: T.muted, marginTop: "8px" }}>
        {images.length}/{MAX_IMAGES} images · Click an image to set it as primary
      </div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", fontWeight: 800, color: T.accent, fontSize: "1.2rem" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent, display: "inline-block" }}></span>
        TradeForge
      </a>
      <nav style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <a href="/"          style={{ textDecoration: "none", color: T.text, background: "#404040", padding: "8px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, fontSize: "0.95rem" }}>Marketplace</a>
        <a href="/messages"  style={{ textDecoration: "none", color: T.text, background: "#404040", padding: "8px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, fontSize: "0.95rem" }}>Inbox</a>
        <a href="/saved"     style={{ textDecoration: "none", color: T.text, background: "#404040", padding: "8px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, fontSize: "0.95rem" }}>Saved</a>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a href="/create-listing" style={{ textDecoration: "none", color: "#fff", background: T.accent, padding: "8px 12px", borderRadius: "10px", border: `1px solid ${T.accent}`, fontSize: "0.95rem", fontWeight: 700 }}>+ Create Listing</a>
            <button onClick={logout} style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: T.accent, fontWeight: 900, fontSize: "14px", cursor: "pointer" }} title={user.full_name}>{initials}</button>
          </div>
        ) : (
          <a href="/login" style={{ textDecoration: "none", color: T.text, background: "#404040", padding: "8px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, fontSize: "0.95rem", fontWeight: 600 }}>Login</a>
        )}
      </nav>
    </header>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
// Pass listingId prop to enter edit mode. Leave undefined for create mode.
export default function CreateEditListingPage({ listingId }: { listingId?: string }) {
  const isEditMode = Boolean(listingId);

  const [form, setForm] = useState<FormData>({
    title:       "",
    description: "",
    price:       "",
    category:    "",
    location:    "",
    condition:   "",
  });

  const [images,   setImages]   = useState<ImageFile[]>([]);
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // ── Load existing data in edit mode ────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !listingId) return;

    getListing(listingId)
      .then((data) => {
        setForm({
          title: data.title,
          description: data.description,
          price: String(data.price),
          category: data.category,
          location: data.location,
          condition: "Used – Very Good",
        });
        setImages(
          (data.images ?? []).map((url, i) => ({
            id: `existing-${i}`,
            preview: url,
            isPrimary: i === 0,
            isExisting: true,
          })),
        );
      })
      .catch(() => {
        setSubmitError("Unable to load listing details.");
      });
  }, [isEditMode, listingId]);

  // ── Field change ───────────────────────────────────────────────────────────
  const setField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleAddImages = (files: FileList) => {
    setImageError("");
    const newImages: ImageFile[] = [];

    Array.from(files).forEach(file => {
      if (images.length + newImages.length >= MAX_IMAGES) {
        setImageError(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setImageError("Only PNG, JPG, and WEBP images are allowed.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setImageError("Each image must be under 5MB.");
        return;
      }
      newImages.push({
        id:        Math.random().toString(36).slice(2),
        file,
        preview:   URL.createObjectURL(file),
        isPrimary: images.length === 0 && newImages.length === 0,
      });
    });

    setImages(prev => [...prev, ...newImages]);
    if (errors.images) setErrors(prev => ({ ...prev, images: undefined }));
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // If we removed the primary, make the first one primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary))
        filtered[0].isPrimary = true;
      return filtered;
    });
  };

  const handleSetPrimary = (id: string) =>
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim())       newErrors.title       = "Title is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    if (!form.category)           newErrors.category    = "Please select a category.";
    if (!form.location.trim())    newErrors.location    = "Location is required.";
    if (!form.condition)          newErrors.condition   = "Please select a condition.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = "Please enter a valid price.";
    if (images.length === 0)
      newErrors.images = "At least one image is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const sorted = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
      const newFiles = sorted.filter((img) => img.file).map((img) => img.file as File);
      const existingUrls = sorted.filter((img) => img.isExisting).map((img) => img.preview);

      const uploaded = newFiles.length > 0 ? await uploadListingImages(newFiles) : [];
      const uploadedUrls = uploaded.map((u) => u.public_url);
      const allImageUrls = [...existingUrls, ...uploadedUrls];

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        location: form.location.trim(),
        images: allImageUrls,
      };

      if (isEditMode && listingId) {
        await updateListing(listingId, payload);
      } else {
        await createListing(payload);
      }

      setSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Unable to save listing. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Arial, sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: "540px", margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: T.text, marginBottom: "10px" }}>
            {isEditMode ? "Listing Updated!" : "Listing Created!"}
          </h2>
          <p style={{ color: T.muted, fontSize: "14px", marginBottom: "28px" }}>
            {isEditMode ? "Your changes have been saved." : "Your listing is now live on the marketplace."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <a href="/" style={{ padding: "11px 24px", borderRadius: "10px", background: T.accent, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>View Marketplace</a>
            <a href="/create-listing" onClick={() => setSuccess(false)} style={{ padding: "11px 24px", borderRadius: "10px", background: T.surface, color: T.text, textDecoration: "none", fontWeight: 600, fontSize: "14px", border: `1px solid ${T.border}` }}>Create Another</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Arial, sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: "24px" }}>
          <a href="/" style={{ fontSize: "13px", color: T.muted, textDecoration: "none" }}>← Back to Marketplace</a>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: T.text, margin: "10px 0 4px" }}>
            {isEditMode ? "Edit Listing" : "Create New Listing"}
          </h1>
          <p style={{ fontSize: "14px", color: T.muted }}>
            {isEditMode ? "Update your listing details below." : "Fill out the details below to list your item."}
          </p>
        </div>

        {/* ── Form Card ── */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>

          {/* ── Section: Basic Info ── */}
          <div style={{ padding: "24px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: "15px", fontWeight: 800, color: T.text, marginBottom: "20px" }}>
              Basic Information
            </div>

            {/* Title */}
            <div style={{ marginBottom: "18px" }}>
              <Label text="Title" required />
              <input
                value={form.title}
                onChange={e => setField("title", e.target.value)}
                placeholder="e.g. iPhone 13 – Blue 128GB"
                maxLength={255}
                style={inputStyle(!!errors.title)}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <ErrorMsg msg={errors.title} />
                <span style={{ fontSize: "11px", color: T.muted, marginTop: "5px" }}>{form.title.length}/255</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "18px" }}>
              <Label text="Description" required />
              <textarea
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                placeholder="Describe your item — condition, features, what's included, meetup preferences..."
                rows={5}
                maxLength={2000}
                style={{ ...inputStyle(!!errors.description), resize: "vertical", minHeight: "110px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <ErrorMsg msg={errors.description} />
                <span style={{ fontSize: "11px", color: T.muted, marginTop: "5px" }}>{form.description.length}/2000</span>
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: "18px" }}>
              <Label text="Price" required />
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: T.muted, fontWeight: 700, fontSize: "14px" }}>$</span>
                <input
                  value={form.price}
                  onChange={e => setField("price", e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  style={{ ...inputStyle(!!errors.price), paddingLeft: "28px" }}
                />
              </div>
              <ErrorMsg msg={errors.price} />
            </div>
          </div>

          {/* ── Section: Details ── */}
          <div style={{ padding: "24px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: "15px", fontWeight: 800, color: T.text, marginBottom: "20px" }}>Details</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Category */}
              <div>
                <Label text="Category" required />
                <select value={form.category} onChange={e => setField("category", e.target.value)} style={{ ...inputStyle(!!errors.category), cursor: "pointer" }}>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ErrorMsg msg={errors.category} />
              </div>

              {/* Condition */}
              <div>
                <Label text="Condition" required />
                <select value={form.condition} onChange={e => setField("condition", e.target.value)} style={{ ...inputStyle(!!errors.condition), cursor: "pointer" }}>
                  <option value="">Select condition</option>
                  {["New", "Like New", "Used – Very Good", "Used – Good", "Used – Fair"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.condition} />
              </div>

              {/* Location */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Label text="Meetup Location" required />
                <input
                  value={form.location}
                  onChange={e => setField("location", e.target.value)}
                  placeholder="e.g. Bowling Green, KY"
                  style={inputStyle(!!errors.location)}
                />
                <ErrorMsg msg={errors.location} />
              </div>
            </div>
          </div>

          {/* ── Section: Images ── */}
          <div style={{ padding: "24px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: "15px", fontWeight: 800, color: T.text, marginBottom: "6px" }}>
              Images <span style={{ color: T.accent }}>*</span>
            </div>
            <div style={{ fontSize: "13px", color: T.muted, marginBottom: "16px" }}>
              Upload up to {MAX_IMAGES} images. The primary image will be shown as the thumbnail.
            </div>
            <ImageUploadZone
              images={images}
              onAdd={handleAddImages}
              onRemove={handleRemoveImage}
              onSetPrimary={handleSetPrimary}
              error={errors.images || imageError}
            />
          </div>

          {/* ── Section: Edit-only — Mark as Sold / Delete ── */}
          {isEditMode && (
            <div style={{ padding: "24px", borderBottom: `1px solid ${T.border}`, background: "rgba(239,68,68,0.03)" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: T.text, marginBottom: "6px" }}>Listing Actions</div>
              <div style={{ fontSize: "13px", color: T.muted, marginBottom: "16px" }}>These actions are permanent and cannot be undone.</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button style={{
                  padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#60a5fa",
                }}>Mark as Sold</button>
                <button style={{
                  padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: T.danger,
                }}>Delete Listing</button>
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <div style={{ padding: "24px", display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
            {Object.keys(errors).length > 0 && (
              <span style={{ fontSize: "13px", color: T.error, fontWeight: 600 }}>
                Please fix the errors above.
              </span>
            )}
            {submitError && (
              <span style={{ fontSize: "13px", color: T.error, fontWeight: 600 }}>
                {submitError}
              </span>
            )}
            <a href="/" style={{ padding: "11px 22px", borderRadius: "10px", border: `1px solid ${T.border}`, background: "transparent", color: T.muted, textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
              Cancel
            </a>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "11px 28px", borderRadius: "10px", border: "none",
                background: submitting ? T.accent2 : T.accent,
                color: "#fff", fontSize: "14px", fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.8 : 1,
                minWidth: "140px",
              }}
            >
              {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Listing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}