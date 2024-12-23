// src/lib/sessionStore.ts
interface SessionResponse {
    session_id: string;
  }
  
  class SessionStore {
    private static sessionId: string | null = null;
  
    static async initSession(): Promise<string> {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FL_API_URL}/api/session/new`, {
          method: 'POST',
        });
        const data = await response.json() as SessionResponse;
        if (!data.session_id) {
          throw new Error('No session ID received');
        }
        this.sessionId = data.session_id;
        return data.session_id;
      } catch (error) {
        console.error('Failed to initialize session:', error);
        throw error;
      }
    }
  
    static getSessionId(): string | null {
      return this.sessionId;
    }
  
    static setSessionId(id: string): void {
      this.sessionId = id;
    }
  
    static clearSession(): void {
      this.sessionId = null;
    }
  
    static async ensureSession(): Promise<string> {
      if (!this.sessionId) {
        return this.initSession();
      }
      return this.sessionId;
    }
  }
  
  export default SessionStore;