package com.tfg.backend.modules.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Servicio encargado de gestionar el envío de correos electrónicos.
 * Proporciona funcionalidades para enviar mensajes en formato HTML utilizando
 * el soporte de JavaMailSender y plantillas integradas.
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    /** Enviador de correos. */
    private final JavaMailSender mailSender;

    /**
     * Envía un correo electrónico en formato HTML a la dirección especificada.
     *
     * @param to          La dirección de correo electrónico del destinatario.
     * @param subject     El asunto del correo electrónico.
     * @param htmlContent El contenido HTML a incluir en el cuerpo del correo.
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(wrapInTemplate(htmlContent), true);
            helper.setFrom("no-reply@uniovi.es");

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando email a " + to + ": " + e.getMessage());
        }
    }

    /**
     * Envuelve el contenido en la plantilla HTML base.
     *
     * @param content Contenido HTML a envolver
     * @return HTML completo
     */
    private String wrapInTemplate(String content) {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
                .header { background-color: #003a70; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background-color: #ffffff; }
                .footer { background-color: #f8f9fa; color: #666; padding: 15px; text-align: center; font-size: 12px; }
                .button { display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
                .logo { font-size: 24px; font-weight: bold; letter-spacing: 1px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">UNIOVI ESPACIOS</div>
                </div>
                <div class="content">
                    """ + content + """
                </div>
                <div class="footer">
                    &copy; 2026 Escuela de Ingeniería Informática - Universidad de Oviedo<br>
                    Este es un correo automático, por favor no responda.
                </div>
            </div>
        </body>
        </html>
        """;
    }
}
