import { Communicate } from 'edge-tts-universal';

export async function generateFreeKannadaSpeech(
  text: string, 
  voice: 'kn-IN-SapnaNeural' | 'kn-IN-GaganNeural' = 'kn-IN-SapnaNeural'
): Promise<Buffer> {
  const communicate = new Communicate(text, { voice });
  const audioChunks: Buffer[] = [];

  for await (const chunk of communicate.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      audioChunks.push(Buffer.from(chunk.data));
    }
  }

  return Buffer.concat(audioChunks);
}