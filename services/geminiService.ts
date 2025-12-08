import { GoogleGenAI, Type } from "@google/genai";

// NOTE: in a real app, this should be proxied through a backend or user should input key.
// For this demo, we assume the environment variable or a safe context.
const apiKey = process.env.API_KEY || ''; 

export const generateReflectionQuestions = async (contextText: string, gradeLevel: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("API Key is missing for Gemini");
    return [
      "Apa bagian yang paling menarik dari cerita ini?",
      "Pelajaran apa yang bisa kamu ambil?",
      "Apakah kamu pernah mengalami hal serupa?"
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Buatkan 3 pertanyaan refleksi yang menarik dan mendidik untuk siswa SD Kelas ${gradeLevel} berdasarkan teks berikut.
      Pertanyaan harus menguji pemahaman dan mendorong pemikiran kritis sederhana.
      
      Teks Bacaan:
      "${contextText.substring(0, 1000)}..."
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of reflection questions"
            }
          }
        }
      }
    });

    const result = response.text ? JSON.parse(response.text) : { questions: [] };
    return result.questions || [];

  } catch (error) {
    console.error("Gemini Error:", error);
    return [
      "Apa yang kamu pelajari dari bacaan ini?",
      "Bagaimana perasaanmu setelah membaca?",
      "Tuliskan satu hal baru yang kamu ketahui."
    ];
  }
};
