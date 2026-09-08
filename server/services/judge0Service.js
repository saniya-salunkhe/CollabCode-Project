const axios = require('axios');

/**
 * Judge0 Service
 *
 * Supports:
 * 1. Self-hosted Judge0
 * 2. RapidAPI Judge0
 */
class Judge0Service {
  constructor() {
    this.baseUrl =
      process.env.JUDGE0_API_URL || 'http://localhost:2358';

    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, '');

    this.apiKey = process.env.JUDGE0_API_KEY || '';

    this.isRapidAPI =
      this.baseUrl.includes('rapidapi.com');
  }

  // -------------------------------------------------------
  // Headers
  // -------------------------------------------------------

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // API key is needed only for RapidAPI
    if (this.isRapidAPI) {
      if (!this.apiKey) {
        throw new Error(
          'RapidAPI Judge0 requires JUDGE0_API_KEY'
        );
      }

      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] =
        'judge0-ce.p.rapidapi.com';
    }

    return headers;
  }

  // -------------------------------------------------------
  // Run Code
  // -------------------------------------------------------

  async run({
    sourceCode,
    languageId,
    stdin = '',
    expectedOutput = null,
  }) {
    try {
      console.log('Using Judge0:', this.baseUrl);
      console.log('Language ID:', languageId);

      const headers = this.getHeaders();

      const body = {
        language_id: Number(languageId),

        source_code: Buffer.from(
          sourceCode || ''
        ).toString('base64'),

        stdin: Buffer.from(
          stdin || ''
        ).toString('base64'),
      };

      // Include expected output even if it is ""
      if (expectedOutput !== null) {
        body.expected_output = Buffer.from(
          expectedOutput
        ).toString('base64');
      }

      const response = await axios.post(
        `${this.baseUrl}/submissions?base64_encoded=true&wait=true`,
        body,
        {
          headers,
          timeout: 30000,
        }
      );

      const data = response.data;

      console.log(
        'Judge0 status:',
        data.status?.description
      );

      // wait=true normally returns completed result
      if (data.status && data.status.id > 2) {
        return this._decode(data);
      }

      // If still queued/processing, poll using token
      if (data.token) {
        return await this._pollResult(
          data.token,
          headers
        );
      }

      return this._decode(data);

    } catch (err) {
      console.error(
        'Judge0 execution error:',
        err.response?.data || err.message
      );

      throw new Error(
        `Code execution failed: ${
          err.response?.data?.message ||
          err.message
        }`
      );
    }
  }

  // -------------------------------------------------------
  // Poll Result
  // -------------------------------------------------------

  async _pollResult(token, headers) {
    const maxAttempts = 15;
    const delay = 1000;

    for (let i = 0; i < maxAttempts; i++) {

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );

      const response = await axios.get(
        `${this.baseUrl}/submissions/${token}?base64_encoded=true`,
        {
          headers,
          timeout: 10000,
        }
      );

      const data = response.data;

      // Judge0:
      // 1 = In Queue
      // 2 = Processing
      // >2 = Finished
      if (data.status && data.status.id > 2) {
        return this._decode(data);
      }
    }

    return {
      stdout: '',
      stderr: '',
      compileOutput: '',
      message: 'Execution timed out',
      time: null,
      memory: null,
      status: {
        id: 13,
        description: 'Internal Error',
      },
    };
  }

  // -------------------------------------------------------
  // Decode Base64 Judge0 Response
  // -------------------------------------------------------

  _decode(data) {

    const decode = (value) => {
      if (!value) {
        return '';
      }

      return Buffer
        .from(value, 'base64')
        .toString('utf-8');
    };

    return {
      stdout: decode(data.stdout),

      stderr: decode(data.stderr),

      compileOutput:
        decode(data.compile_output),

      message:
        decode(data.message),

      time: data.time,

      memory: data.memory,

      status: data.status,

      // Important:
      // This confirms this is REAL Judge0
      _simulated: false,
    };
  }
}

module.exports = {
  judge0Service: new Judge0Service(),
};