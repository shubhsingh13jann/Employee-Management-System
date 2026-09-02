export type UserRole = "admin" | "manager" | "supervisor" | "employee";
export type AuthStatus = "idle" | "submitting" | "success" | "error";
export type ActiveField = "email" | "password" | null;

export interface CharacterStageProps {
  mousePos?: { x: number; y: number };
  activeField?: ActiveField;
  caretProgress?: number;
  showPassword?: boolean;
  selectedRole?: UserRole;
  authStatus?: AuthStatus;
}

export interface RoleTheme {
  badgeTitle: string;
  badgeDesc: string;
  accent: string;
  accentBg: string;
  border: string;
}
