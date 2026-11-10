import Image from "next/image";

/*
============================================================
The college crest (public/logo.jpg).

The original file is large (about 1.2 MB), so it goes
through Next's image optimiser, which sends a small copy
sized for where it is shown.

The crest is taller than it is wide (1631 x 1916), so the
box is given a height and the width follows.
============================================================
*/

export default function CollegeLogo({
  className = "h-11",
  priority = false,
}) {
  return (
    <Image
      src="/logo.jpg"
      alt="Karnataka (Govt.) Polytechnic, Mangaluru crest"
      width={1631}
      height={1916}
      sizes="64px"
      priority={priority}
      className={`w-auto shrink-0 object-contain ${className}`}
    />
  );
}
