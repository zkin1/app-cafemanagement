export interface User {
    id?: number;
    username: string;
    password: string;
    role: 'employee' | 'admin' | 'manager';
    name: string;
    email: string;
    phoneNumber?: string;
    hireDate?: Date;
    lastLogin?: Date;
  }