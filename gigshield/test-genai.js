import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6I_S1932J1iJEmRaquOwosSQsTA-QkQwls4358KzDc-HQ' });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'hello',
    });
    console.log("SUCCESS:", response.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
