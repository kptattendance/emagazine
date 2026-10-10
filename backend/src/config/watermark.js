/*
Stamped permanently on every magazine image when it is uploaded,
so no clean copy of the image exists anywhere.

White text on a dark strip stays readable on light drawings
and on dark photographs alike.
*/

export const WATERMARK = [
  {
    overlay: {
      font_family: "Arial",
      font_size: 60,
      font_weight: "bold",
      text: " KPT Mangaluru eMagazine ",
    },
    color: "#FFFFFF",
    background: "#00000099",
  },
  // Text width is a share of the image width, whatever the image size
  {
    width: "0.4",
    crop: "scale",
    flags: "relative",
  },
  {
    flags: "layer_apply",
    gravity: "south_east",
    x: 0.02,
    y: 0.02,
  },
];
