package com.tfg.backend.modules.analytics.service.generators;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Clase base abstracta que proporciona métodos utilitarios compartidos para la generación de documentos PDF.
 * Centraliza la configuración de estilos visuales, la inicialización del documento, 
 * y la construcción estandarizada de elementos comunes como cabeceras, tarjetas de resumen y pies de página.
 */
public abstract class AbstractPdfGenerator {

    /**
     * Inicializa y configura la estructura básica de un nuevo documento PDF.
     *
     * @param out El flujo de salida donde se escribirá el contenido.
     * @param title El título que se establecerá en los metadatos del PDF.
     * @return El objeto Document preparado para ser modificado.
     */
    protected Document createDocument(ByteArrayOutputStream out, String title) {
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        pdf.getDocumentInfo().setTitle(title);
        
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(15, 15, 15, 15);
        return document;
    }

    /**
     * Construye una celda de encabezado estandarizada para tablas de datos.
     *
     * @param text El texto que mostrará el encabezado.
     * @return Un objeto Cell configurado con el estilo definido para cabeceras.
     */
    protected Cell createHeaderCell(String text) {
        return new Cell().add(new Paragraph(text).setBold().setFontSize(8))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.8f));
    }

    /**
     * Incorpora el pie de página por defecto en el documento, incluyendo la fecha de generación.
     *
     * @param document El documento PDF al cual se agregará el pie de página.
     */
    protected void addFooter(Document document) {
        document.add(new Paragraph("\n\n"));
        document.add(new LineSeparator(new SolidLine(0.5f)).setMarginTop(10).setMarginBottom(10));
        document.add(new Paragraph("Informe generado automáticamente por el Centro de Informes - " + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
    }

    /**
     * Genera un componente visual a modo de tarjeta que presenta un dato clave resumido.
     *
     * @param label Etiqueta descriptiva del valor.
     * @param value Dato o métrica a mostrar de manera destacada.
     * @return Una celda estructurada visualmente como tarjeta de resumen.
     */
    protected Cell createSummaryCard(String label, String value) {
        Cell cell = new Cell().setPadding(10).setTextAlignment(TextAlignment.CENTER);
        cell.add(new Paragraph(label).setFontSize(9).setBold().setFontColor(ColorConstants.GRAY));
        cell.add(new Paragraph(value).setFontSize(16).setBold().setFontColor(ColorConstants.BLACK));
        cell.setBorder(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        return cell;
    }
}
