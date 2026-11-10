/*
============================================================
A photo shown whole, never cropped, inside a box of any
shape. The space around it is filled with a soft, blurred
and enlarged copy of the same photo, so tall photos and
collages look good in a wide box (and the other way round).

The parent decides the size and must be "relative".
============================================================
*/

export default function FittedImage({
  src,
  alt = "",
  eager = false,
  className = "",
}) {
  return (
    <>
      {/* background: same photo, blurred, filling the box */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
      />

      <div className="absolute inset-0 bg-slate-900/25" />

      {/* the photo itself, whole */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 h-full w-full object-contain ${className}`}
      />
    </>
  );
}
