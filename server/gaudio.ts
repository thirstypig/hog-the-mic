import axios from 'axios';

const GAUDIO_API_URL = 'https://restapi.gaudiolab.io/developers/api';
const API_KEY = process.env.GAUDIO_API_KEY;

interface GaudioCreateUploadResponse {
  resultCode: number;
  resultMessage?: string;
  resultData?: {
    uploadId: string;
    chunkSize: number;
    preSignedUrl: string[];
  };
}

interface GaudioCompleteUploadResponse {
  resultCode: number;
  resultMessage?: string;
  resultData?: {};
}

interface GaudioCreateJobResponse {
  resultCode: number;
  resultMessage?: string;
  resultData?: {
    jobId: string;
  };
}

interface GaudioJobStatusResponse {
  resultCode: number;
  resultMessage?: string;
  resultData?: {
    jobId: string;
    status: 'waiting' | 'running' | 'success' | 'failed';
    errorMessage?: string;
    expireAt?: string;
    downloadUrl?: {
      vocal?: { mp3: string; wav: string };
      drum?: { mp3: string; wav: string };
      bass?: { mp3: string; wav: string };
      electric_guitar?: { mp3: string; wav: string };
      acoustic_piano?: { mp3: string; wav: string };
      others?: { mp3: string; wav: string };
    };
  };
}

export class GaudioStudioService {
  private apiKey: string;

  constructor() {
    if (!API_KEY) {
      throw new Error('GAUDIO_API_KEY is not configured');
    }
    this.apiKey = API_KEY;
  }

  /**
   * Upload audio file to Gaudio using multipart upload
   */
  async uploadAudioFromUrl(audioUrl: string, filename: string): Promise<string> {
    try {
      // Download audio from URL
      const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);
      const fileSize = audioBuffer.length;

      console.log(`Gaudio: Uploading ${filename} (${fileSize} bytes)`);

      // Step 1: Create upload URL
      const createResponse = await axios.post<GaudioCreateUploadResponse>(
        `${GAUDIO_API_URL}/v1/files/upload-multipart/create`,
        {
          fileName: filename,
          fileSize: fileSize,
        },
        {
          headers: {
            'x-ga-apikey': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (createResponse.data.resultCode !== 1000 || !createResponse.data.resultData) {
        throw new Error(createResponse.data.resultMessage || 'Failed to create upload URL');
      }

      const { uploadId, chunkSize, preSignedUrl } = createResponse.data.resultData;
      console.log(`Gaudio: Upload ID ${uploadId}, ${preSignedUrl.length} chunks`);

      // Step 2: Upload chunks
      const parts: { awsETag: string; partNumber: number }[] = [];
      
      for (let i = 0; i < preSignedUrl.length; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, audioBuffer.length);
        const chunk = audioBuffer.slice(start, end);

        const uploadResponse = await axios.put(preSignedUrl[i], chunk, {
          headers: {
            'Content-Type': 'audio/mpeg',
          },
        });

        const etag = uploadResponse.headers['etag']?.replace(/"/g, '') || '';
        parts.push({
          awsETag: etag,
          partNumber: i + 1,
        });

        console.log(`Gaudio: Uploaded chunk ${i + 1}/${preSignedUrl.length}`);
      }

      // Step 3: Complete upload
      const completeResponse = await axios.post<GaudioCompleteUploadResponse>(
        `${GAUDIO_API_URL}/v1/files/upload-multipart/complete`,
        {
          uploadId: uploadId,
          parts: parts,
        },
        {
          headers: {
            'x-ga-apikey': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (completeResponse.data.resultCode !== 1000) {
        throw new Error(completeResponse.data.resultMessage || 'Failed to complete upload');
      }

      console.log(`Gaudio: Upload completed successfully (${uploadId})`);
      return uploadId;
    } catch (error: any) {
      console.error('Gaudio upload error:', error.response?.data || error.message);
      throw new Error(`Failed to upload to Gaudio: ${error.response?.data?.resultMessage || error.message}`);
    }
  }

  /**
   * Create vocal separation job
   * @param uploadId - Upload ID from uploadAudioFromUrl()
   * @param stemTypes - Comma-separated stems: 'vocal', 'drum', 'bass', 'electric_guitar', 'acoustic_piano'
   */
  async createSeparationJob(uploadId: string, stemTypes: string = 'vocal'): Promise<string> {
    try {
      const response = await axios.post<GaudioCreateJobResponse>(
        `${GAUDIO_API_URL}/v1/gsep_music_hq_v1/jobs`,
        {
          audioUploadId: uploadId,
          type: stemTypes,
        },
        {
          headers: {
            'x-ga-apikey': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.resultCode !== 1000 || !response.data.resultData) {
        throw new Error(response.data.resultMessage || 'Failed to create separation job');
      }

      const jobId = response.data.resultData.jobId;
      console.log(`Gaudio: Separation job created (${jobId})`);
      return jobId;
    } catch (error: any) {
      console.error('Gaudio job creation error:', error.response?.data || error.message);
      throw new Error(`Failed to create separation job: ${error.response?.data?.resultMessage || error.message}`);
    }
  }

  /**
   * Check job status and get download URLs when ready
   */
  async checkJobStatus(jobId: string): Promise<GaudioJobStatusResponse['resultData']> {
    try {
      const response = await axios.get<GaudioJobStatusResponse>(
        `${GAUDIO_API_URL}/v1/gsep_music_hq_v1/jobs/${jobId}`,
        {
          headers: {
            'x-ga-apikey': this.apiKey,
          },
        }
      );

      if (response.data.resultCode !== 1000 || !response.data.resultData) {
        throw new Error(response.data.resultMessage || 'Failed to check job status');
      }

      return response.data.resultData;
    } catch (error: any) {
      console.error('Gaudio status check error:', error.response?.data || error.message);
      throw new Error(`Failed to check job status: ${error.response?.data?.resultMessage || error.message}`);
    }
  }

  /**
   * Process complete workflow: upload → separate → get instrumental URL
   * For karaoke, we want to remove vocals and get the instrumental (others) track
   */
  async processVocalSeparation(audioUrl: string, filename: string): Promise<string> {
    // Upload audio file
    const uploadId = await this.uploadAudioFromUrl(audioUrl, filename);
    
    // Create separation job (vocal + others/instrumental)
    const jobId = await this.createSeparationJob(uploadId, 'vocal');
    
    return jobId;
  }

  /**
   * Get instrumental URL from completed job
   * Returns the "others" track (everything except vocals) for karaoke
   */
  async getInstrumentalUrl(jobId: string): Promise<string | null> {
    const result = await this.checkJobStatus(jobId);
    
    if (!result) {
      return null;
    }
    
    if (result.status === 'waiting' || result.status === 'running') {
      return null; // Still processing
    }

    if (result.status === 'failed') {
      throw new Error(result.errorMessage || 'Job processing failed');
    }

    // For karaoke, we want the instrumental (non-vocal) track
    // When separating vocals, Gaudio returns both "vocal" and "others" (instrumental)
    // We prefer MP3 for web streaming
    if (result.downloadUrl?.others?.mp3) {
      return result.downloadUrl.others.mp3;
    }

    // Fallback to WAV if MP3 not available
    if (result.downloadUrl?.others?.wav) {
      return result.downloadUrl.others.wav;
    }

    return null;
  }

  /**
   * TODO: YouTube URL support (coming soon to Gaudio API)
   * Once Gaudio adds YouTube URL support to their API (like their web app has),
   * we can add a method like this:
   * 
   * async processYouTubeUrl(youtubeUrl: string): Promise<string> {
   *   const response = await axios.post(
   *     `${GAUDIO_API_URL}/v1/gsep_music_hq_v1/jobs`,
   *     {
   *       youtubeUrl: youtubeUrl,  // Direct YouTube URL
   *       type: 'vocal'
   *     },
   *     {
   *       headers: {
   *         'x-ga-apikey': this.apiKey,
   *         'Content-Type': 'application/json',
   *       },
   *     }
   *   );
   *   return response.data.resultData.jobId;
   * }
   */
}
