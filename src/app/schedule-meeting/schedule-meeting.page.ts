import { Component } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { EmailService } from '../services/email.service';
import { User } from '../models/user.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-schedule-meeting',
  templateUrl: './schedule-meeting.page.html',
  styleUrls: ['./schedule-meeting.page.scss'],
})
export class ScheduleMeetingPage {
  meeting = {
    title: '',
    datetime: '',
    description: '',
    participants: [] as string[]
  };

  users: User[] = [];
  currentDate: string;
  isSubmitting: boolean = false;

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
    private databaseService: DatabaseService,
    private emailService: EmailService
  ) {
    this.currentDate = new Date().toISOString();
  }

  ngOnInit() {
    this.loadUsers();
  }

  private async loadUsers() {
    try {
      this.users = await firstValueFrom(this.databaseService.getAllUsers());
    } catch (error) {
      console.error('Error al cargar los usuarios:', error);
      await this.presentToast('Error al cargar los usuarios', 'danger');
    }
  }

  private formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateString;
    }
  }

  async scheduleMeeting(e: Event) {
    e.preventDefault();

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.meeting.participants.length === 0) {
      await this.presentToast('Debes seleccionar al menos un participante.', 'warning');
      this.isSubmitting = false;
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Programando reunión...',
    });
    await loading.present();

    try {
      const formattedDateTime = this.formatDateTime(this.meeting.datetime);
      let failedEmails: string[] = [];

      // Enviar correos a todos los participantes
      for (const participantEmail of this.meeting.participants) {
        try {
          const result = await firstValueFrom(
            this.emailService.sendMeetingInvitation(
              participantEmail,
              this.meeting.title,
              formattedDateTime,
              this.meeting.description
            )
          );

          if (!result.success) {
            failedEmails.push(participantEmail);
          }
        } catch (error) {
          console.error(`Error al enviar correo a ${participantEmail}:`, error);
          failedEmails.push(participantEmail);
        }
      }

      await loading.dismiss();

      if (failedEmails.length > 0) {
        await this.presentToast(
          `Reunión programada pero hubo errores al enviar algunos correos: ${failedEmails.join(', ')}`,
          'warning'
        );
      } else {
        await this.presentToast('Reunión programada y correos enviados con éxito', 'success');
        this.resetForm();
      }
    } catch (error) {
      console.error('Error al programar la reunión:', error);
      await this.presentToast(
        'Error al programar la reunión. Por favor, intente de nuevo.',
        'danger'
      );
    } finally {
      this.isSubmitting = false;
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  resetForm() {
    this.meeting = {
      title: '',
      datetime: '',
      description: '',
      participants: []
    };
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: color
    });
    await toast.present();
  }
}