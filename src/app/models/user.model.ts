export interface User {
  UserID?: number;
  Username: string;
  Password: string;
  Role: 'employee' | 'admin' | 'manager';
  Name: string;
  Email: string;
  PhoneNumber?: string;
  HireDate?: Date;
  LastLogin?: Date;
  ApprovalStatus: 'pending' | 'approved' | 'rejected';
  ProfilePicture?: string | null;
}