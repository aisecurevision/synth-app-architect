
interface GenerateCodeParams {
  prompt: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

const API_URL = 'http://192.168.20.10:1234';

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: params.prompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};
