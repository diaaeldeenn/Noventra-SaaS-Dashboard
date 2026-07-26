import ExcelJS from "exceljs";
import PDFDocument from "pdfkit-table";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
  HeadingLevel,
} from "docx";

//* ================= 1. EXCEL GENERATOR =================
export const generateExcelReport = async (sales, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Invoice Number", key: "invoiceNumber", width: 22 },
    { header: "Date & Time", key: "createdAt", width: 22 },
    { header: "Seller Name", key: "sellerName", width: 20 },
    { header: "Total Items", key: "totalItems", width: 12 },
    { header: "Total Amount ($)", key: "totalAmount", width: 18 },
    { header: "Total Profit ($)", key: "totalProfit", width: 18 },
    { header: "Payment Method", key: "paymentMethod", width: 15 },
    { header: "Status", key: "status", width: 15 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F2937" },
  };

  sales.forEach((sale) => {
    const totalItemsCount = sale.items.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
    worksheet.addRow({
      invoiceNumber: sale.invoiceNumber,
      createdAt: new Date(sale.createdAt).toLocaleString(),
      sellerName: sale.soldBy?.name || "N/A",
      totalItems: totalItemsCount,
      totalAmount: sale.totalAmount,
      totalProfit: sale.totalProfit,
      paymentMethod: sale.paymentMethod.toUpperCase(),
      status: sale.isCancelled ? "CANCELLED" : "COMPLETED",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=sales-report-${Date.now()}.xlsx`,
  );

  await workbook.xlsx.write(res);
  res.status(200).end();
};

//^ ================= 2. PDF GENERATOR =================
export const generatePdfReport = async (sales, res) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=sales-report-${Date.now()}.pdf`,
  );

  doc.pipe(res);

  doc.fontSize(18).text("Noventra ERP - Sales Report", { align: "center" });
  doc.moveDown();

  const tableRows = sales.map((sale) => [
    sale.invoiceNumber,
    new Date(sale.createdAt).toLocaleDateString(),
    sale.soldBy?.name || "N/A",
    `$${sale.totalAmount}`,
    `$${sale.totalProfit}`,
    sale.paymentMethod.toUpperCase(),
    sale.isCancelled ? "CANCELLED" : "COMPLETED",
  ]);

  const table = {
    headers: [
      "Invoice #",
      "Date",
      "Seller",
      "Total",
      "Profit",
      "Payment",
      "Status",
    ],
    rows: tableRows,
  };

  await doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
      doc.font("Helvetica").fontSize(9);
    },
  });

  doc.end();
};

//? ================= 3. WORD GENERATOR =================
export const generateWordReport = async (sales, res) => {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: "Invoice #", bold: true })],
        }),
        new TableCell({
          children: [new Paragraph({ text: "Date", bold: true })],
        }),
        new TableCell({
          children: [new Paragraph({ text: "Seller", bold: true })],
        }),
        new TableCell({
          children: [new Paragraph({ text: "Total ($)", bold: true })],
        }),
        new TableCell({
          children: [new Paragraph({ text: "Profit ($)", bold: true })],
        }),
        new TableCell({
          children: [new Paragraph({ text: "Status", bold: true })],
        }),
      ],
    }),
  ];

  sales.forEach((sale) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(sale.invoiceNumber)] }),
          new TableCell({
            children: [
              new Paragraph(new Date(sale.createdAt).toLocaleDateString()),
            ],
          }),
          new TableCell({
            children: [new Paragraph(sale.soldBy?.name || "N/A")],
          }),
          new TableCell({ children: [new Paragraph(`$${sale.totalAmount}`)] }),
          new TableCell({ children: [new Paragraph(`$${sale.totalProfit}`)] }),
          new TableCell({
            children: [
              new Paragraph(sale.isCancelled ? "CANCELLED" : "COMPLETED"),
            ],
          }),
        ],
      }),
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Noventra ERP - Sales Report",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleString()}`,
          }),
          new Paragraph({ text: " " }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=sales-report-${Date.now()}.docx`,
  );

  res.status(200).send(buffer);
};
