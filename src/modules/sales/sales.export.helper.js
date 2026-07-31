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

//^ 4. Export Single Sale to Excel
export const exportSingleSaleToExcel = async (sale, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Invoice_${sale.invoiceNumber}`);

  worksheet.addRow(["INVOICE DETAILS"]).font = { bold: true, size: 14 };
  worksheet.addRow(["Invoice Number", sale.invoiceNumber]);
  worksheet.addRow([
    "Date",
    DateTime.fromJSDate(new Date(sale.createdAt)).toFormat(
      "yyyy-MM-dd HH:mm:ss",
    ),
  ]);
  worksheet.addRow(["Sold By", sale.soldBy?.name || "N/A"]);
  worksheet.addRow(["Payment Method", sale.paymentMethod]);
  worksheet.addRow([]);

  const headerRow = worksheet.addRow([
    "Product Name",
    "Quantity",
    "Unit Price",
    "Total Price",
  ]);
  headerRow.font = { bold: true };

  sale.items.forEach((item) => {
    worksheet.addRow([
      item.productId?.name || "Product",
      item.quantity,
      item.sellingPriceAtSale,
      item.sellingPriceAtSale * item.quantity,
    ]);
  });

  worksheet.addRow([]);
  const totalRow = worksheet.addRow([
    "",
    "",
    "Total Amount:",
    sale.totalAmount,
  ]);
  totalRow.font = { bold: true };

  worksheet.columns = [
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  await workbook.xlsx.write(res);
  res.status(200).end();
};

//^ 5. Export Single Sale to PDF
export const exportSingleSaleToPDF = (sale, res) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  doc.pipe(res);

  const formattedDate = DateTime.fromJSDate(new Date(sale.createdAt)).toFormat(
    "yyyy-MM-dd HH:mm:ss",
  );

  doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(10).font("Helvetica");
  doc.text(`Invoice Number: ${sale.invoiceNumber}`);
  doc.text(`Date: ${formattedDate}`);
  doc.text(`Sold By: ${sale.soldBy?.name || "N/A"}`);
  doc.text(`Payment Method: ${sale.paymentMethod}`);
  doc.moveDown(1.5);

  const tableRows = sale.items.map((item) => [
    item.productId?.name || "Product",
    item.quantity.toString(),
    `$${item.sellingPriceAtSale.toFixed(2)}`,
    `$${(item.sellingPriceAtSale * item.quantity).toFixed(2)}`,
  ]);

  const table = {
    headers: ["Product Name", "Qty", "Unit Price", "Total Price"],
    rows: tableRows,
  };

  doc.table(table, {
    prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
    prepareRow: () => doc.fontSize(9).font("Helvetica"),
  });

  doc.moveDown(1);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(`Total Amount: $${sale.totalAmount.toFixed(2)}`, { align: "right" });

  doc.end();
};

//^ 6. Export Single Sale to Word
export const exportSingleSaleToWord = async (sale, res) => {
  const formattedDate = DateTime.fromJSDate(new Date(sale.createdAt)).toFormat(
    "yyyy-MM-dd HH:mm:ss",
  );

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Product Name", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Qty", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Unit Price", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Total", bold: true })],
            }),
          ],
        }),
      ],
    }),
  ];

  sale.items.forEach((item) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(item.productId?.name || "Product")],
          }),
          new TableCell({
            children: [new Paragraph(item.quantity.toString())],
          }),
          new TableCell({
            children: [new Paragraph(`$${item.sellingPriceAtSale.toFixed(2)}`)],
          }),
          new TableCell({
            children: [
              new Paragraph(
                `$${(item.sellingPriceAtSale * item.quantity).toFixed(2)}`,
              ),
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
            children: [
              new TextRun({
                text: `INVOICE: ${sale.invoiceNumber}`,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({ text: `Date: ${formattedDate}` }),
          new Paragraph({ text: `Sold By: ${sale.soldBy?.name || "N/A"}` }),
          new Paragraph({ text: `Payment Method: ${sale.paymentMethod}` }),
          new Paragraph({ text: "" }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Amount: $${sale.totalAmount.toFixed(2)}`,
                bold: true,
                size: 24,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  res.status(200).send(buffer);
};
