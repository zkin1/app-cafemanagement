import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { EmailResult } from '../models/email.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import emailjs from '@emailjs/browser';


@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly PUBLIC_KEY = 'DKpjvXERVCYX9x65l';
  private readonly SERVICE_ID = 'service_ilwn599';
  private readonly VERIFICATION_TEMPLATE_ID = 'template_okp70bp';
  private readonly MEETING_TEMPLATE_ID = 'template_lxd51ex';

  constructor(private http: HttpClient) {
    emailjs.init(this.PUBLIC_KEY);
  }

  sendVerificationCode(to: string, code: string): Observable<EmailResult> {
    console.log('Attempting to send verification code to:', to);
    
    const templateParams = {
      to_name: to.split('@')[0], 
      from_name: "CaffeManagement",
      to_email: to,
      message: code, 
      subject: "Código de verificación"
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Try both methods - EmailJS SDK and direct HTTP
    return from(emailjs.send(
      this.SERVICE_ID,
      this.VERIFICATION_TEMPLATE_ID,
      templateParams
    )).pipe(
      timeout(10000),
      map(response => {
        console.log('Email sent successfully:', response);
        return {
          messageId: Date.now().toString(),
          success: true,
          text: 'Email sent successfully'
        };
      }),
      catchError(error => {
        console.error('Email sending error details:', {
          error,
          errorMessage: error.message,
          errorStack: error.stack,
          errorStatus: error.status,
          errorStatusText: error.statusText,
          errorResponse: error.error,
          timestamp: new Date().toISOString(),
          templateParams
        });
        
        return from([{
          messageId: '',
          success: false,
          error: this.getReadableErrorMessage(error)
        }]);
      })
    );
  }

  sendMeetingInvitation(
    to: string,
    meetingTitle: string,
    meetingDateTime: string,
    meetingDescription: string
  ): Observable<EmailResult> {
    console.log('Sending meeting invitation to:', to);

    const templateParams = {
      to_email: to,
      to_name: to.split('@')[0], // Extraemos el nombre del email
      from_name: "CaffeManagement",
      meeting_title: meetingTitle,
      meeting_datetime: meetingDateTime,
      meeting_description: meetingDescription || 'Sin descripción'
    };

    return from(emailjs.send(
      this.SERVICE_ID,
      this.MEETING_TEMPLATE_ID,
      templateParams
    )).pipe(
      timeout(10000),
      map(response => {
        console.log('Meeting invitation sent successfully:', response);
        return {
          messageId: Date.now().toString(),
          success: true,
          text: 'Meeting invitation sent successfully'
        };
      }),
      catchError(error => {
        console.error('Error sending meeting invitation:', {
          error,
          to,
          meetingTitle,
          timestamp: new Date().toISOString()
        });
        
        return from([{
          messageId: '',
          success: false,
          error: this.getReadableErrorMessage(error)
        }]);
      })
    );
  }

  private getReadableErrorMessage(error: any): string {
    if (!navigator.onLine) {
      return 'No hay conexión a Internet. Por favor, verifique su conexión.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Por favor, intente nuevamente.';
    }
    
    if (error.status === 403) {
      return 'Error de autenticación con el servicio de correo.';
    }

    if (error.name === 'TimeoutError') {
      return 'La solicitud ha excedido el tiempo de espera. Por favor, intente nuevamente.';
    }

    return error.message || 'Error desconocido al enviar el correo';
  }
}