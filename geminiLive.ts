import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

interface GeminiCallbacks {
  onUpdate: (expansion: number, tension: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private stopSignal = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(callbacks: GeminiCallbacks) {
    this.stopSignal = false;

    // Define the tool for the model to call
    const updateInteractionTool: FunctionDeclaration = {
      name: 'updateInteraction',
      parameters: {
        type: Type.OBJECT,
        description: 'Updates the particle system state based on hand gestures.',
        properties: {
          expansion: {
            type: Type.NUMBER,
            description: 'Distance between hands (0.0 to 1.0)',
          },
          tension: {
            type: Type.NUMBER,
            description: 'Hand tension/clench level (0.0 to 1.0)',
          },
        },
        required: ['expansion', 'tension'],
      },
    };

    // We only use audio modality for response because it's required, 
    // but we primarily listen for tool calls.
    const config = {
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Connected');
          callbacks.onConnect();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Tool Calls
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'updateInteraction') {
                const { expansion, tension } = fc.args as any;
                // Safely cast and clamp
                const safeExpansion = Math.max(0, Math.min(1, Number(expansion) || 0));
                const safeTension = Math.max(0, Math.min(1, Number(tension) || 0));
                
                callbacks.onUpdate(safeExpansion, safeTension);

                // We must respond to the tool call
                this.sessionPromise?.then((session) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: 'ok' },
                    },
                  });
                });
              }
            }
          }
        },
        onclose: () => {
          console.log('Gemini Live Closed');
          callbacks.onDisconnect();
        },
        onerror: (e: any) => {
          console.error('Gemini Live Error', e);
          callbacks.onDisconnect();
        },
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseModalities: [Modality.AUDIO], // Required by API
        tools: [{ functionDeclarations: [updateInteractionTool] }],
      },
    };

    try {
      this.sessionPromise = this.ai.live.connect(config);
      await this.sessionPromise;
    } catch (err) {
      console.error("Failed to connect to Gemini Live:", err);
      callbacks.onDisconnect();
    }
  }

  async sendVideoFrame(base64Data: string) {
    if (this.stopSignal || !this.sessionPromise) return;

    this.sessionPromise.then((session) => {
      try {
        session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        });
      } catch (e) {
        console.error("Error sending frame:", e);
      }
    });
  }

  disconnect() {
    this.stopSignal = true;
    // There isn't a direct "disconnect" method exposed easily on the session promise result 
    // based on the simplified types, but closing the context/releasing works in real usage 
    // often by just stopping the stream. We'll rely on reloading or the session timing out if unused.
    // Ideally, we would call session.close() if available on the resolved object.
    this.sessionPromise?.then(session => {
        if(typeof session.close === 'function') {
            session.close();
        }
    })
    this.sessionPromise = null;
  }
}
