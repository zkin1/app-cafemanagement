export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}
