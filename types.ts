export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // Array of person IDs
}

export interface ReceiptData {
  merchantName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  serviceCharge: number; // 10% usually
  gst: number; // 9% usually
  total: number;
}

export interface Person {
  id: string;
  name: string;
  mobileNumber?: string; // For PayNow
  color: string;
}

export interface BillState {
  step: 'upload' | 'analyzing' | 'assign' | 'summary';
  receiptImage: string | null;
  rawReceiptData: ReceiptData | null;
  people: Person[];
  hostPersonId: string; // The person receiving money
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  type: 'text' | 'image' | 'action';
  imageData?: string;
}
