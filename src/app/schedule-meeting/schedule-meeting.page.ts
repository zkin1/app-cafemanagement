import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { DatabaseService } from '../services/database.service';
import { User } from '../models/user.model';

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

  constructor(private toastController: ToastController, private databaseService: DatabaseService) {
    this.currentDate = new Date().toISOString();
  }

  ngOnInit() {
    // Cargar usuarios desde la base de datos
    this.databaseService.getAllUsers().subscribe(
      users => this.users = users,
      error => console.error('Error al cargar los usuarios:', error)
    );
  }

  async scheduleMeeting(e: Event) {
    e.preventDefault();

    try {
      if (this.meeting.participants.length === 0) {
        throw new Error('Debes seleccionar al menos un participante.');
      }
  
      const participantsEmails = this.meeting.participants.join(',');
  
      const templateParams = {
        to_email: participantsEmails, 
        meeting_title: this.meeting.title,
        meeting_datetime: this.meeting.datetime,
        meeting_description: this.meeting.description
      };
  
      // Enviar el correo electrónico utilizando EmailJS
      emailjs.send('service_wfe771n', 'template_lxd51ex', templateParams, 'DKpjvXERVCYX9x65l')
        .then(() => {
          console.log('SUCCESS!');
          this.presentToast('Reunión programada y correos enviados con éxito', 'success');
          this.resetForm();
        }, (error: EmailJSResponseStatus) => {
          console.error('FAILED...', error.text);
          this.presentToast('Error al programar la reunión', 'danger');
        });
    } catch (error) {
      console.error('Error al programar la reunión:', error); 
      this.presentToast('Error al programar la reunión', 'danger');
    }
  }
  
  resetForm() {
    // Restablecer los valores del formulario después de programar la reunión
    this.meeting = {
      title: '',
      datetime: '',
      description: '',
      participants: []
    };
  }

  async presentToast(message: string, color: string) {
    // Mostrar un mensaje toast con el resultado de la operación
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}