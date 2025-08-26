export interface JwtPayload {
  sub: number;
  email: string | null;
  roles: string[];
  activeCompanyId?: number;
  sessionId: string;
}
