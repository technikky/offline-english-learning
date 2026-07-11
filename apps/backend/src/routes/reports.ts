import type { FastifyInstance } from "fastify";
import PDFDocument from "pdfkit";
import { authenticate, requireRole } from "../auth/middleware";
import { getOwnedClass } from "../teacher/ownership";
import { getClassStudentStats, type StudentStats } from "../teacher/classStats";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(className: string, stats: StudentStats[]): string {
  const header = [
    "Student Name",
    "Email",
    "Conversations",
    "Grammar Mistakes",
    "Vocabulary Words",
    "Estimated Level",
  ];
  const lines = [header.join(",")];

  for (const row of stats) {
    lines.push(
      [
        csvEscape(row.displayName),
        csvEscape(row.email),
        csvEscape(row.conversationCount),
        csvEscape(row.mistakeCount),
        csvEscape(row.vocabularyCount),
        csvEscape(row.estimatedLevel),
      ].join(","),
    );
  }

  return lines.join("\n") + "\n";
}

function buildPdf(className: string, stats: StudentStats[]): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40 });

  doc.fontSize(18).text(`Class Report: ${className}`, { underline: true });
  doc.moveDown();
  doc.fontSize(10).fillColor("gray").text(new Date().toISOString());
  doc.moveDown(1.5);

  const columns = [
    { label: "Student", width: 140 },
    { label: "Conversations", width: 90 },
    { label: "Mistakes", width: 70 },
    { label: "Vocabulary", width: 80 },
    { label: "Level", width: 60 },
  ];

  const startX = doc.x;
  let y = doc.y;

  doc.fontSize(11).fillColor("black");
  let x = startX;
  for (const col of columns) {
    doc.text(col.label, x, y, { width: col.width, continued: false });
    x += col.width;
  }
  y += 20;
  doc
    .moveTo(startX, y - 4)
    .lineTo(x, y - 4)
    .strokeColor("#cccccc")
    .stroke();

  for (const row of stats) {
    const values = [
      row.displayName,
      String(row.conversationCount),
      String(row.mistakeCount),
      String(row.vocabularyCount),
      row.estimatedLevel,
    ];
    x = startX;
    for (let i = 0; i < columns.length; i++) {
      doc.text(values[i], x, y, { width: columns[i].width });
      x += columns[i].width;
    }
    y += 18;
  }

  if (stats.length === 0) {
    doc.text("No students in this class yet.", startX, y);
  }

  doc.end();
  return doc;
}

export function registerReportRoutes(app: FastifyInstance): void {
  app.get<{ Params: { id: string } }>(
    "/teacher/classes/:id/report.csv",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) return reply.code(404).send({ error: "Class not found" });

      const stats = await getClassStudentStats(classId);
      const csv = buildCsv(classRow.name, stats);

      reply.header("Content-Type", "text/csv");
      reply.header(
        "Content-Disposition",
        `attachment; filename="${classRow.name.replace(/[^a-z0-9]/gi, "_")}-report.csv"`,
      );
      return reply.send(csv);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/teacher/classes/:id/report.pdf",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) return reply.code(404).send({ error: "Class not found" });

      const stats = await getClassStudentStats(classId);

      reply.hijack();
      reply.raw.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${classRow.name.replace(/[^a-z0-9]/gi, "_")}-report.pdf"`,
      });

      const doc = buildPdf(classRow.name, stats);
      doc.pipe(reply.raw);
    },
  );
}
