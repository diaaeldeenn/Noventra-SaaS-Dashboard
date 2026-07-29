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

//* 1. Excel Export
export const exportSalesToExcel = async (sales, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Invoice Number", key: "invoiceNumber", width: 25 },
    { header: "Date & Time", key: "createdAt", width: 22 },
    { header: "Sold By", key: "soldBy", width: 20 },
    { header: "Items Count", key: "itemsCount", width: 12 },
    { header: "Total Amount ($)", key: "totalAmount", width: 18 },
    { header: "Total Profit ($)", key: "totalProfit", width: 18 },
    { header: "Payment Method", key: "paymentMethod", width: 15 },
  ];

  sales.forEach((sale) => {
    worksheet.addRow({
      invoiceNumber: sale.invoiceNumber,
      createdAt: DateTime.fromJSDate(new Date(sale.createdAt)).toFormat(
        "yyyy-MM-dd HH:mm:ss",
      ),
      soldBy: sale.soldBy?.name || "N/A",
      itemsCount: sale.items ? sale.items.length : 0,
      totalAmount: sale.totalAmount,
      totalProfit: sale.totalProfit,
      paymentMethod: sale.paymentMethod,
    });
  });

  worksheet.getRow(1).font = { bold: true };
  await workbook.xlsx.write(res);
  res.status(200).end();
};

//^ 2. PDF Export
export const exportSalesToPDF = (sales, res) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  doc.pipe(res);

  const formattedGeneratedAt = DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss");

  doc.fontSize(18).text("Sales Summary Report", { align: "center" });
  doc
    .fontSize(10)
    .text(`Generated On: ${formattedGeneratedAt}`, { align: "center" });
  doc.moveDown(2);

  const tableRows = sales.map((sale) => [
    sale.invoiceNumber,
    DateTime.fromJSDate(new Date(sale.createdAt)).toFormat("yyyy-MM-dd HH:mm"),
    sale.soldBy?.name || "N/A",
    `$${sale.totalAmount.toFixed(2)}`,
    `$${sale.totalProfit.toFixed(2)}`,
    sale.paymentMethod,
  ]);

  const table = {
    headers: ["Invoice", "Date", "Sold By", "Total", "Profit", "Method"],
    rows: tableRows,
  };

  doc.table(table, {
    prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
    prepareRow: () => doc.fontSize(9).font("Helvetica"),
  });

  doc.end();
};

//? 3. Word Export
export const exportSalesToWord = async (sales, res) => {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Invoice", bold: true })],
            }),
          ],
        }),
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
              children: [new TextRun({ text: "Sold By", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Total ($)", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Profit ($)", bold: true })],
            }),
          ],
        }),
      ],
    }),
  ];

  sales.forEach((sale) => {
    const formattedDate = DateTime.fromJSDate(
      new Date(sale.createdAt),
    ).toFormat("yyyy-MM-dd HH:mm");

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(sale.invoiceNumber)] }),
          new TableCell({ children: [new Paragraph(formattedDate)] }),
          new TableCell({
            children: [new Paragraph(sale.soldBy?.name || "N/A")],
          }),
          new TableCell({
            children: [new Paragraph(sale.totalAmount.toString())],
          }),
          new TableCell({
            children: [new Paragraph(sale.totalProfit.toString())],
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
            children: [
              new TextRun({
                text: "Sales Report",
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
