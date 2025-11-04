import axios from 'axios';
import FormData from 'form-data';

const LALAL_API_URL = 'https://www.lalal.ai/api';
const API_KEY = process.env.LALAL_AI_API_KEY;

interface LalalUploadResponse {
  status: 'success' | 'error';
  id?: string;
  duration?: number;
  size?: number;
  expires?: number;
  error?: string;
}

interface LalalSplitResponse {
  status: 'success' | 'error';
  task_id?: string;
  error?: string;
}

interface LalalCheckResult {
  [fileId: string]: {
    status: 'success' | 'error';
    name?: string;
    size?: number;
    duration?: number;
    splitter?: string;
    stem?: string;
    split?: {
      duration: number;
      stem: string;
      stem_track: string;
      stem_track_size: number;
      back_track: string;
      back_track_size: number;
    };
    task?: {
      state: 'success' | 'error' | 'progress' | 'cancelled';
      error?: string;
      progress?: number;
    };
    error?: string;
  };
}

interface LalalCheckResponse {
  status: 'success' | 'error';
  result?: LalalCheckResult;
  error?: string;
}

export class LalalAIService {
  private apiKey: string;

  constructor() {
    if (!API_KEY) {
      throw new Error('LALAL_AI_API_KEY is not configured');
    }
    this.apiKey = API_KEY;
  }

  async uploadAudioFromUrl(audioUrl: string, filename: string): Promise<string> {
    try {
      const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);

      const response = await axios.post(
        `${LALAL_API_URL}/upload/`,
        audioBuffer,
        {
          headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Authorization': `license ${this.apiKey}`,
            'Content-Type': 'audio/mpeg',
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      const data: LalalUploadResponse = response.data;
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Upload failed');
      }

      if (!data.id) {
        throw new Error('No file ID returned from upload');
      }

      console.log(`LALAL.AI upload successful: ${data.id}, duration: ${data.duration}s`);
      return data.id;
    } catch (error: any) {
      console.error('LALAL.AI upload error:', error.response?.data || error.message);
      throw new Error(`Failed to upload to LALAL.AI: ${error.response?.data?.error || error.message}`);
    }
  }

  async splitAudio(fileId: string, stem: 'vocals' | 'drum' | 'bass' | 'piano' = 'vocals'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('params', JSON.stringify([{
        id: fileId,
        stem: stem,
        splitter: 'phoenix',
      }]));

      const response = await axios.post(
        `${LALAL_API_URL}/split/`,
        formData,
        {
          headers: {
            'Authorization': `license ${this.apiKey}`,
            ...formData.getHeaders(),
          },
        }
      );

      const data: LalalSplitResponse = response.data;
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Split failed');
      }

      console.log(`LALAL.AI split job created for file ${fileId}`);
      return fileId;
    } catch (error: any) {
      console.error('LALAL.AI split error:', error.response?.data || error.message);
      throw new Error(`Failed to split audio: ${error.response?.data?.error || error.message}`);
    }
  }

  async checkStatus(fileId: string): Promise<LalalCheckResult[string] | null> {
    try {
      const formData = new FormData();
      formData.append('id', fileId);

      const response = await axios.post(
        `${LALAL_API_URL}/check/`,
        formData,
        {
          headers: {
            'Authorization': `license ${this.apiKey}`,
            ...formData.getHeaders(),
          },
        }
      );

      const data: LalalCheckResponse = response.data;
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Check status failed');
      }

      if (data.result && data.result[fileId]) {
        return data.result[fileId];
      }

      return null;
    } catch (error: any) {
      console.error('LALAL.AI check error:', error.response?.data || error.message);
      throw new Error(`Failed to check status: ${error.response?.data?.error || error.message}`);
    }
  }

  async processVocalSeparation(audioUrl: string, filename: string): Promise<string> {
    const fileId = await this.uploadAudioFromUrl(audioUrl, filename);
    await this.splitAudio(fileId);
    return fileId;
  }

  async getInstrumentalUrl(fileId: string): Promise<string | null> {
    const result = await this.checkStatus(fileId);
    
    if (!result) {
      return null;
    }

    if (result.task?.state === 'progress') {
      return null;
    }

    if (result.task?.state === 'error') {
      throw new Error(result.task.error || 'Processing failed');
    }

    if (result.split?.back_track) {
      return result.split.back_track;
    }

    return null;
  }
}
