import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import * as nodemailer from 'nodemailer';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'caffemanagement@gmail.com',
        pass: 'ookz wztn afmw lhlu' 
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  sendVerificationCode(to: string, code: string): Observable<any> {
    const mailOptions = {
      from: '"CaffeManagement" <caffemanagement@gmail.com>',
      to: to,
      subject: 'Código de Verificación - CaffeManagement',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #84B0A2; text-align: center;">CaffeManagement</h2>
            <h3 style="color: #405770;">Código de Verificación</h3>
            <p style="color: #666;">Su código de verificación para restablecer la contraseña es:</p>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #405770; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">Este código expirará en 15 minutos.</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Si usted no solicitó este cambio de contraseña, por favor ignore este correo.</p>
          </div>
        </div>
      `
    };

    return from(this.transporter.sendMail(mailOptions));
  }
}