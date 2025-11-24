/**TOTP service for frontend (development only).*/

/**
 * Get current TOTP code from secret (development only).
 * In production, this should not be exposed to frontend.
 */
export class TOTPService {
  /**
   * Get current TOTP code (development only).
   * This calls the backend to get the current code.
   */
  static async getCurrentCode(secret: string): Promise<string> {
    // In development, we can call backend to get current code
    // In production, this should not be available
    try {
      const { azkabanApi } = await import('../stores/common/api-client');
      const response = await azkabanApi.post('/v1/auth/get-current-totp', {
        secret: secret,
      });
      return response.data.totp_code;
    } catch (error) {
      console.error('[TOTPService] Error getting current code:', error);
      return '';
    }
  }
}
