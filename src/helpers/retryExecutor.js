
class RetryApi {
  static async executeWithBackoff(executor, maxAttempts = 3) {
    let attempt = 0
    while (attempt < maxAttempts) {
      try {
        const result = await executor()
        return result;
      } catch (error) {
        attempt++;
        if (attempt === maxAttempts) throw error;
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}

export default RetryApi

