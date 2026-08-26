import { streamText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const s = () => {
    const result = streamText({
        model: google('gemini-2.5-flash-lite');
        
    })
    return result.toTextStreamResponse();
}
