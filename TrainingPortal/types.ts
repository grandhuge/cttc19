
import { Timestamp } from "./services/firebaseService";

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'sub-admin' | 'admin';
  prefix: string;
  name: string;
  surname: string;
  position: string;
  organization: string;
  address?: string;
  district?: string; // Tambon
  amphoe?: string; // Amphoe
  province: string;
  education: string;
  phone?: string;
  contactEmail?: string;
  dob?: string;
}

export interface Enrollment {
  courseId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  preTestCompleted: boolean;
  contentViewed: boolean;
  postTestCompleted: boolean;
  postTestScore: number | null;
  surveyCompleted: boolean;
  surveyResponses: Record<string, any> | null;
  completionDate?: Timestamp | null;
}

export interface Coordinate {
  value: number;
  unit: 'px' | '%';
}

export interface Coordinates {
  x: Coordinate;
  y: Coordinate;
}

export interface FontSettings {
  family: string;
  size: number; // in px
}

export interface Course {
  id: string;
  title: string;
  description: string;
  content: string; // HTML content from rich text editor
  passPercentage: number;
  isPostTestActive: boolean;
  assignedAdmins?: string[];
  hasCertificate?: boolean;
  certificateTemplateUrl?: string;
  nameCoordinates?: Coordinates;
  dateCoordinates?: Coordinates;
  nameFontSettings?: FontSettings;
  dateFontSettings?: FontSettings;
  showDateOnCertificate?: boolean;
  showPrefixOnCertificate?: boolean;
  isEnrollmentOpen?: boolean;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'multiple-choice';
  order: number;
  options: QuizOption[];
}

export interface SurveyQuestion {
  id: string;
  questionText: string;
  type: 'rating' | 'text';
  order: number;
  required: boolean;
}

export interface ReplyContext {
  messageId: string;
  senderName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'sub-admin' | 'admin';
  timestamp: Timestamp;
  replyTo?: ReplyContext;
}
