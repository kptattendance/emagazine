"use client";

import { jsPDF } from "jspdf";

import {
  drawImageInBox,
  drawLetterheadFooter,
  drawLetterheadHeader,
  LETTERHEAD_FOOTER_HEIGHT,
  LETTERHEAD_HEADER_BOTTOM,
  LETTERHEAD_MARGIN,
} from "./letterheadPdf";

import { kannadaFontFamily } from "./letterheadAssets";
import { getDepartmentLabel } from "../departments";
import { achievementSummary } from "../achievement";

/*
============================================================
MONTHLY ISSUE (PDF)

Cover page with the month, totals and contents, then every
article: photo, author, full text, likes and reader comments.

Same college letterhead and footer as the IA progress
report, on every page.
============================================================
*/

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = LETTERHEAD_MARGIN;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_TOP = LETTERHEAD_HEADER_BOTTOM + 6;
const CONTENT_BOTTOM = PAGE_HEIGHT - LETTERHEAD_FOOTER_HEIGHT - 4;

// ---------------- colours
const INK = [15, 23, 42];
const BODY = [51, 65, 85];
const MUTED = [100, 116, 139];
const WHITE = [255, 255, 255];
const TEAL = [15, 118, 110];
const TEAL_DARK = [17, 94, 89];
const TEAL_SOFT = [204, 251, 241];
const AMBER = [217, 119, 6];
const AMBER_SOFT = [254, 243, 199];
const VIOLET = [109, 40, 217];
const VIOLET_SOFT = [237, 233, 254];
const ROSE = [225, 29, 72];
const ROSE_SOFT = [255, 228, 230];
const SKY = [2, 132, 199];
const SKY_SOFT = [224, 242, 254];

const TYPE_STYLE = {
  activity: { label: "COLLEGE ACTIVITY", color: TEAL, soft: TEAL_SOFT },
  creative: { label: "CREATIVE CORNER", color: VIOLET, soft: VIOLET_SOFT },
  achievement: { label: "ACHIEVEMENT", color: AMBER, soft: AMBER_SOFT },
};

const typeStyle = (article) =>
  TYPE_STYLE[article.contentType] || TYPE_STYLE.activity;

// mm per point, and line height as a multiple of font size
const PT = 0.3528;
const LINE = 1.45;

const lineHeight = (size) => size * PT * LINE;

/*
============================================================
TEXT

PDF fonts only cover English letters. Text with Kannada (or
other scripts, or emoji) is drawn by the browser into small
images, one per line, like the Kannada footer.
============================================================
*/

const PLAIN_TEXT =
  /^[\x00-\xFF–—‘’“”•…€]*$/;

const isPlain = (text) => PLAIN_TEXT.test(String(text || ""));

// Pixels per mm when drawing text as images (print quality)
const PX_PER_MM = 12;

let measureContext = null;

const canvasFont = (size, bold) =>
  `${bold ? 700 : 400} ${size * PT * PX_PER_MM}px ${kannadaFontFamily()}, Helvetica, Arial, sans-serif`;

// Wrap text to a width, measuring the way the browser draws it
const wrapForCanvas = (text, width, size, bold) => {
  measureContext ||= document.createElement("canvas").getContext("2d");
  measureContext.font = canvasFont(size, bold);

  const maxPx = width * PX_PER_MM;
  const lines = [];

  String(text)
    .split(/\r?\n/)
    .forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        lines.push("");
        return;
      }

      let line = "";

      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;

        if (measureContext.measureText(next).width <= maxPx || !line) {
          line = next;
        } else {
          lines.push(line);
          line = word;
        }
      });

      lines.push(line);
    });

  return lines;
};

const lineImage = (line, size, bold, color) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  context.font = canvasFont(size, bold);

  const width = Math.max(1, Math.ceil(context.measureText(line).width) + 4);
  const height = Math.ceil(size * PT * LINE * PX_PER_MM);

  canvas.width = width;
  canvas.height = height;

  context.font = canvasFont(size, bold);
  context.fillStyle = `rgb(${color.join(",")})`;
  context.textBaseline = "middle";
  context.fillText(line, 0, height / 2);

  return {
    data: canvas.toDataURL("image/png"),
    width: width / PX_PER_MM,
    height: height / PX_PER_MM,
  };
};

// Lines of text, ready to measure and draw
const layoutText = (doc, text, { width, size, bold = false }) => {
  const value = String(text || "");

  if (isPlain(value)) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);

    return {
      plain: true,
      lines: doc.splitTextToSize(value, width),
    };
  }

  return {
    plain: false,
    lines: wrapForCanvas(value, width, size, bold),
  };
};

// Draws one laid-out line with its top at y
const drawLine = (doc, layout, line, x, y, { size, bold, color, align = "left", width }) => {
  if (layout.plain) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const left = align === "center" ? x + width / 2 : x;

    doc.text(line, left, y + lineHeight(size) * 0.72, {
      align,
    });

    return;
  }

  if (!line) return;

  const image = lineImage(line, size, bold, color);
  const left = align === "center" ? x + (width - image.width) / 2 : x;

  doc.addImage(image.data, "PNG", left, y, image.width, image.height);
};

/*
============================================================
PAGE WRITER: keeps track of the position on the page and
starts a new page (with the letterhead) when needed.
============================================================
*/

class Writer {
  constructor(doc, letterhead) {
    this.doc = doc;
    this.letterhead = letterhead;
    this.y = CONTENT_TOP;
  }

  newPage() {
    this.doc.addPage();
    drawLetterheadHeader(this.doc, this.letterhead);
    this.y = CONTENT_TOP;
  }

  ensure(height) {
    if (this.y + height > CONTENT_BOTTOM) {
      this.newPage();
    }
  }

  // Wrapped text that continues onto new pages
  text(value, { x = MARGIN, width = CONTENT_WIDTH, size = 10.5, bold = false, color = BODY, align = "left", after = 0 } = {}) {
    const layout = layoutText(this.doc, value, { width, size, bold });
    const step = lineHeight(size);

    layout.lines.forEach((line) => {
      this.ensure(step);
      drawLine(this.doc, layout, line, x, this.y, { size, bold, color, align, width });
      this.y += step;
    });

    this.y += after;
  }
}

/*
============================================================
SMALL DRAWING HELPERS
============================================================
*/

const pill = (doc, text, x, y, { fill, color = WHITE, size = 7.5, height = 6 }) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);

  const width = doc.getTextWidth(text) + 6;

  doc.setFillColor(...fill);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, "F");

  doc.setTextColor(...color);
  doc.text(text, x + 3, y + height / 2 + size * PT * 0.35);

  return width;
};

const withOpacity = (doc, opacity, draw) => {
  try {
    doc.setGState(new doc.GState({ opacity }));
    draw();
  } finally {
    try {
      doc.setGState(new doc.GState({ opacity: 1 }));
    } catch {
      // Older viewers: no transparency, nothing to undo
    }
  }
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

const monthLabel = (month) => {
  const [year, number] = String(month).split("-").map(Number);

  return new Date(year, number - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const authorOf = (article) => {
  const student = article.student || {};
  const faculty = article.faculty || {};

  if (student.name) {
    return {
      name: student.name,
      detail: [
        student.registerNumber,
        student.semester ? `Semester ${student.semester}` : "",
      ]
        .filter(Boolean)
        .join("  |  "),
      photo: student.photo,
      kind: "Student",
    };
  }

  return {
    name: faculty.name || article.submittedBy?.name || "KPT Mangaluru",
    detail: faculty.designation || "",
    photo: faculty.photo,
    kind: faculty.name ? "Faculty" : "",
  };
};

/*
============================================================
COVER
============================================================
*/

const CONTENTS_ROW = 9;
const CONTENTS_ROWS_ON_COVER = 11;
const CONTENTS_ROWS_PER_PAGE = Math.floor((CONTENT_BOTTOM - CONTENT_TOP - 12) / CONTENTS_ROW);

const contentsPagesNeeded = (count) =>
  count <= CONTENTS_ROWS_ON_COVER
    ? 0
    : Math.ceil((count - CONTENTS_ROWS_ON_COVER) / CONTENTS_ROWS_PER_PAGE);

const drawCover = (doc, { month, scope, totals }) => {
  const top = CONTENT_TOP - 1;

  // ---- banner
  doc.setFillColor(...TEAL_DARK);
  doc.roundedRect(MARGIN, top, CONTENT_WIDTH, 58, 5, 5, "F");

  withOpacity(doc, 0.18, () => {
    doc.setFillColor(...TEAL_SOFT);
    doc.circle(MARGIN + CONTENT_WIDTH - 12, top + 6, 26, "F");
    doc.circle(MARGIN + CONTENT_WIDTH - 46, top + 60, 18, "F");
    doc.setFillColor(...AMBER_SOFT);
    doc.circle(MARGIN + 10, top + 52, 14, "F");
  });

  doc.setFillColor(...AMBER);
  doc.rect(MARGIN + 10, top + 11, 26, 1.6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(253, 230, 138);
  doc.text("KPT E-MAGAZINE", MARGIN + 10, top + 9);

  doc.setFontSize(30);
  doc.setTextColor(...WHITE);
  doc.text(`${monthLabel(month)} Issue`, MARGIN + 10, top + 27);

  doc.setFontSize(13);
  doc.setTextColor(204, 251, 241);
  doc.text(scope, MARGIN + 10, top + 37);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Activities, creative work and achievements of our students and staff",
    MARGIN + 10,
    top + 46
  );

  // ---- totals
  const tiles = [
    { label: "Articles", value: totals.articles, color: TEAL, soft: TEAL_SOFT },
    { label: "Likes", value: totals.likes, color: ROSE, soft: ROSE_SOFT },
    { label: "Comments", value: totals.comments, color: SKY, soft: SKY_SOFT },
    { label: "Contributors", value: totals.contributors, color: AMBER, soft: AMBER_SOFT },
  ];

  const gap = 4;
  const tileWidth = (CONTENT_WIDTH - gap * 3) / 4;
  const tileTop = top + 64;

  tiles.forEach((tile, index) => {
    const x = MARGIN + index * (tileWidth + gap);

    doc.setFillColor(...tile.soft);
    doc.roundedRect(x, tileTop, tileWidth, 22, 3, 3, "F");

    doc.setFillColor(...tile.color);
    doc.roundedRect(x, tileTop, 2.2, 22, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...tile.color);
    doc.text(String(tile.value), x + 7, tileTop + 11);

    doc.setFontSize(8.5);
    doc.setTextColor(...BODY);
    doc.text(tile.label.toUpperCase(), x + 7, tileTop + 18);
  });

  // ---- contents heading
  const headingTop = tileTop + 31;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text("In This Issue", MARGIN, headingTop);

  doc.setFillColor(...AMBER);
  doc.rect(MARGIN, headingTop + 2, 18, 1.2, "F");

  return headingTop + 7;
};

// Contents rows, filled in once page numbers are known
const drawContents = (doc, letterhead, entries, firstTop, contentsPages) => {
  let page = 1;
  let y = firstTop;
  let rowsLeft = CONTENTS_ROWS_ON_COVER;

  doc.setPage(page);

  entries.forEach((entry, index) => {
    if (rowsLeft === 0) {
      page += 1;

      if (page > 1 + contentsPages) return;

      doc.setPage(page);
      y = CONTENT_TOP + 4;
      rowsLeft = CONTENTS_ROWS_PER_PAGE;
    }

    const style = typeStyle(entry.article);

    // zebra background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(MARGIN, y - 1, CONTENT_WIDTH, CONTENTS_ROW - 1, 2, 2, "F");
    }

    // numbered dot in the type colour
    doc.setFillColor(...style.color);
    doc.circle(MARGIN + 4.5, y + 3.3, 3.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(String(index + 1), MARGIN + 4.5, y + 4.4, { align: "center" });

    // title, one line
    const titleWidth = CONTENT_WIDTH - 80;
    const layout = layoutText(doc, entry.article.title, { width: titleWidth, size: 9.5, bold: true });
    const first = layout.lines[0] || "";
    const title = layout.lines.length > 1 && layout.plain ? `${first.replace(/\s+\S*$/, "")}...` : first;

    drawLine(doc, layout, title, MARGIN + 10, y + 0.3, { size: 9.5, bold: true, color: INK });

    // department and type
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `${String(entry.article.department || "").toUpperCase()}  |  ${style.label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`,
      MARGIN + CONTENT_WIDTH - 62,
      y + 4.3
    );

    // page number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...style.color);
    doc.text(String(entry.page), MARGIN + CONTENT_WIDTH - 3, y + 4.3, { align: "right" });

    y += CONTENTS_ROW;
    rowsLeft -= 1;
  });

  if (entries.length === 0) {
    doc.setPage(1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No articles were published this month.", MARGIN, firstTop + 4);
  }
};

/*
============================================================
ONE ARTICLE
============================================================
*/

const drawArticle = (writer, article, images) => {
  const { doc } = writer;
  const style = typeStyle(article);

  writer.newPage();

  // Page the article starts on, for the contents list
  const startPage = doc.getNumberOfPages();

  // ---- coloured strip: type, department, category
  doc.setFillColor(...style.color);
  doc.roundedRect(MARGIN, writer.y, CONTENT_WIDTH, 9, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(style.label, MARGIN + 4, writer.y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    [getDepartmentLabel(article.department), article.activity?.name]
      .filter(Boolean)
      .join("  |  "),
    MARGIN + CONTENT_WIDTH - 4,
    writer.y + 6,
    { align: "right" }
  );

  writer.y += 14;

  // ---- title
  writer.text(article.title, { size: 18, bold: true, color: INK, after: 1 });

  // ---- date and achievement
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(formatDate(article.eventDate), MARGIN, writer.y + 3);

  if (article.contentType === "achievement") {
    const summary = achievementSummary(article.achievement);

    if (summary) {
      const dateWidth = doc.getTextWidth(formatDate(article.eventDate));

      pill(doc, summary.toUpperCase(), MARGIN + dateWidth + 4, writer.y - 0.8, {
        fill: AMBER,
        size: 7.5,
      });
    }
  }

  writer.y += 8;

  // ---- photo
  const photo = images[article.eventPhoto];

  if (photo) {
    const { width, height } = doc.getImageProperties(photo);
    const scale = Math.min(CONTENT_WIDTH / width, 95 / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;

    writer.ensure(drawHeight + 6);

    const left = MARGIN + (CONTENT_WIDTH - drawWidth) / 2;

    doc.setFillColor(...style.soft);
    doc.roundedRect(left - 2, writer.y - 2, drawWidth + 4, drawHeight + 4, 3, 3, "F");

    doc.addImage(photo, "JPEG", left, writer.y, drawWidth, drawHeight);

    writer.y += drawHeight + 7;
  }

  // ---- author card
  const author = authorOf(article);
  const portrait = images[author.photo];
  const cardHeight = 24;

  writer.ensure(cardHeight + 4);

  doc.setFillColor(...style.soft);
  doc.roundedRect(MARGIN, writer.y, CONTENT_WIDTH, cardHeight, 3, 3, "F");

  doc.setFillColor(...style.color);
  doc.roundedRect(MARGIN, writer.y, 2.2, cardHeight, 1, 1, "F");

  let textLeft = MARGIN + 7;

  if (portrait) {
    drawImageInBox(doc, portrait, MARGIN + 6, writer.y + 2.5, 17, 19, "center");
    textLeft = MARGIN + 27;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...style.color);
  doc.text(
    author.kind ? `CONTRIBUTED BY  |  ${author.kind.toUpperCase()}` : "CONTRIBUTED BY",
    textLeft,
    writer.y + 6.5
  );

  const nameLayout = layoutText(doc, author.name, { width: CONTENT_WIDTH - 40, size: 12, bold: true });
  drawLine(doc, nameLayout, nameLayout.lines[0] || "", textLeft, writer.y + 8.3, { size: 12, bold: true, color: INK });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BODY);
  doc.text(
    [author.detail, getDepartmentLabel(article.department)].filter(Boolean).join("  |  "),
    textLeft,
    writer.y + 19.5
  );

  writer.y += cardHeight + 7;

  // ---- the article itself
  writer.text(article.description, { size: 10.5, color: BODY, after: 6 });

  // ---- likes and comments
  writer.ensure(14);

  const comments = article.comments || [];
  const likesWidth = pill(doc, `LIKES  ${article.likeCount || 0}`, MARGIN, writer.y, {
    fill: ROSE_SOFT,
    color: ROSE,
    size: 8.5,
    height: 7,
  });

  pill(doc, `COMMENTS  ${comments.length}`, MARGIN + likesWidth + 3, writer.y, {
    fill: SKY_SOFT,
    color: SKY,
    size: 8.5,
    height: 7,
  });

  writer.y += 13;

  // ---- reader comments
  if (comments.length === 0) {
    return startPage;
  }

  writer.ensure(12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("What Readers Say", MARGIN, writer.y + 4);

  doc.setFillColor(...SKY);
  doc.rect(MARGIN, writer.y + 6, 16, 1.1, "F");

  writer.y += 11;

  comments.forEach((comment) => {
    const textWidth = CONTENT_WIDTH - 12;
    const layout = layoutText(doc, comment.text, { width: textWidth, size: 9.5 });
    const step = lineHeight(9.5);
    const boxHeight = 10 + layout.lines.length * step + 2;

    writer.ensure(boxHeight + 3);

    doc.setFillColor(...SKY_SOFT);
    doc.roundedRect(MARGIN, writer.y, CONTENT_WIDTH, boxHeight, 2.5, 2.5, "F");

    doc.setFillColor(...SKY);
    doc.roundedRect(MARGIN, writer.y, 1.8, boxHeight, 0.9, 0.9, "F");

    const nameLayout = layoutText(doc, comment.name, { width: 70, size: 9.5, bold: true });
    drawLine(doc, nameLayout, nameLayout.lines[0] || "", MARGIN + 6, writer.y + 1.6, { size: 9.5, bold: true, color: INK });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `${comment.visitorType}  |  ${comment.place}  |  ${formatDate(comment.createdAt)}`,
      MARGIN + CONTENT_WIDTH - 4,
      writer.y + 5.2,
      { align: "right" }
    );

    let y = writer.y + 8.5;

    layout.lines.forEach((line) => {
      drawLine(doc, layout, line, MARGIN + 6, y, { size: 9.5, color: BODY });
      y += step;
    });

    writer.y += boxHeight + 3;
  });

  return startPage;
};

/*
============================================================
BUILD
============================================================

issue      { month: "2026-10", department: "CS" | "", data: [articles] }
images     { [url]: dataUrl }  photos already loaded
letterhead from loadLetterhead()
============================================================
*/

export const buildMonthlyIssuePdf = ({ issue, images, letterhead }) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const articles = issue.data || [];
  const scope = issue.department
    ? `${getDepartmentLabel(issue.department)}`
    : "All Departments";

  const totals = {
    articles: articles.length,
    likes: articles.reduce((sum, article) => sum + (article.likeCount || 0), 0),
    comments: articles.reduce((sum, article) => sum + (article.comments?.length || 0), 0),
    contributors: new Set(articles.map((article) => authorOf(article).name)).size,
  };

  // ---- cover, and room for a longer contents list
  drawLetterheadHeader(doc, letterhead);

  const contentsTop = drawCover(doc, { month: issue.month, scope, totals });

  const contentsPages = contentsPagesNeeded(articles.length);

  for (let page = 0; page < contentsPages; page += 1) {
    doc.addPage();
    drawLetterheadHeader(doc, letterhead);
  }

  // ---- articles, remembering where each starts
  const writer = new Writer(doc, letterhead);
  const entries = [];

  articles.forEach((article) => {
    entries.push({
      article,
      page: drawArticle(writer, article, images),
    });
  });

  drawContents(doc, letterhead, entries, contentsTop, contentsPages);

  drawLetterheadFooter(
    doc,
    letterhead,
    (current, count) =>
      `KPT E-Magazine  |  ${monthLabel(issue.month)} Issue  |  ${scope}  |  Page ${current} of ${count}  |  emag.kptmangaluru.in`
  );

  return doc;
};

export const issueFileName = (issue) =>
  `KPT-eMagazine-${issue.month}${issue.department ? `-${issue.department}` : ""}.pdf`;

export const issueMonthLabel = monthLabel;
