import ExcelJS from "exceljs";
import PDFDocument from "pdfkit-table";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { DateTime } from "luxon";

//* 1. Excel
export const exportAuditLogsToExcel = async (logs, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Audit Logs");

  worksheet.columns = [
    { header: "Date & Time", key: "createdAt", width: 22 },
    { header: "User Name", key: "userName", width: 20 },
    { header: "User Email", key: "email", width: 25 },
    { header: "Action", key: "action", width: 20 },
    { header: "Target Model", key: "targetModel", width: 15 },
    { header: "Details", key: "details", width: 45 },
  ];

  logs.forEach((log) => {
    worksheet.addRow({
      createdAt: DateTime.fromJSDate(new Date(log.createdAt)).toFormat(
        "yyyy-MM-dd HH:mm:ss",
      ),
      userName: log.userId?.userName || "N/A",
      email: log.userId?.email || "N/A",
      action: log.action,
      targetModel: log.targetModel || "N/A",
      details: log.details || "",
    });
  });

  worksheet.getRow(1).font = { bold: true };
  await workbook.xlsx.write(res);
  res.status(200).end();
};

//^ 2. PDF
export const exportAuditLogsToPDF = (logs, res) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        res.status(200).send(pdfData);
        resolve();
      });
      doc.on("error", (err) => reject(err));

      const formattedGeneratedAt = DateTime.now().toFormat(
        "yyyy-MM-dd HH:mm:ss",
      );

      doc.fontSize(18).text("Audit Logs Report", { align: "center" });
      doc
        .fontSize(10)
        .text(`Generated On: ${formattedGeneratedAt}`, { align: "center" });
      doc.moveDown(2);

      const tableRows = logs.map((log) => [
        DateTime.fromJSDate(new Date(log.createdAt)).toFormat(
          "yyyy-MM-dd HH:mm",
        ),
        log.userId?.userName || "N/A",
        log.action || "N/A",
        log.targetModel || "N/A",
        log.details || "",
      ]);

      const table = {
        headers: ["Date", "User", "Action", "Target", "Details"],
        rows: tableRows,
      };

      doc.table(table, {
        prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
        prepareRow: () => doc.fontSize(9).font("Helvetica"),
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

//? 3. Word
export const exportAuditLogsToWord = async (logs, res) => {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Date", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "User", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Action", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Details", bold: true })],
            }),
          ],
        }),
      ],
    }),
  ];

  logs.forEach((log) => {
    const formattedDate = DateTime.fromJSDate(new Date(log.createdAt)).toFormat(
      "yyyy-MM-dd HH:mm",
    );

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(formattedDate)] }),
          new TableCell({
            children: [new Paragraph(log.userId?.userName || "N/A")],
          }),
          new TableCell({ children: [new Paragraph(log.action)] }),
          new TableCell({ children: [new Paragraph(log.details || "")] }),
        ],
      }),
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Audit Logs Report",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            text: `Generated at: ${DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss")}`,
          }),
          new Paragraph({ text: "" }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  res.status(200).send(buffer);
};
