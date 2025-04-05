// We'll use OpenAI for most text processing tasks
import { generateText } from "./openai";

// Define response interfaces
interface TextProcessingResponse {
  processedText: string;
  original: string;
  processingType: string;
}

// Summarize text
export async function summarizeText(
  text: string,
  options: {
    length?: "short" | "medium" | "long";
    format?: "paragraph" | "bullets";
    focusOn?: string;
  } = {}
): Promise<TextProcessingResponse> {
  try {
    // Set default options
    const {
      length = "medium",
      format = "paragraph",
      focusOn
    } = options;

    // Generate length instruction
    let lengthInstruction = "";
    switch (length) {
      case "short":
        lengthInstruction = "a very concise summary (1-2 sentences)";
        break;
      case "medium":
        lengthInstruction = "a moderate length summary (1-2 paragraphs)";
        break;
      case "long":
        lengthInstruction = "a comprehensive summary (multiple paragraphs)";
        break;
    }

    // Generate format instruction
    const formatInstruction = format === "bullets" 
      ? "Format the summary as bullet points." 
      : "Format the summary as paragraphs.";

    // Generate focus instruction
    const focusInstruction = focusOn 
      ? `Focus primarily on aspects related to: ${focusOn}.` 
      : "";

    // Create prompt
    const prompt = `Summarize the following text. Provide ${lengthInstruction}. ${formatInstruction} ${focusInstruction}\n\nText: ${text}`;

    // Use OpenAI to generate the summary
    const response = await generateText(prompt, 1000, 0.3);

    return {
      processedText: response.text,
      original: text,
      processingType: "summarize"
    };
  } catch (error) {
    console.error("Text summarization error:", error);
    throw new Error(`Failed to summarize text: ${error.message}`);
  }
}

// Format text (convert between formats)
export async function formatText(
  text: string,
  targetFormat: "markdown" | "html" | "plain" | "json",
  options: {
    includeHeadings?: boolean;
    includeLists?: boolean;
    indentationSpaces?: number;
  } = {}
): Promise<TextProcessingResponse> {
  try {
    // Set default options
    const {
      includeHeadings = true,
      includeLists = true,
      indentationSpaces = 2
    } = options;

    // Create formatting instructions
    let formatInstructions = `Convert the following text to ${targetFormat} format.`;
    
    if (targetFormat === "markdown" || targetFormat === "html") {
      if (includeHeadings) {
        formatInstructions += " Include appropriate headings.";
      }
      if (includeLists) {
        formatInstructions += " Convert appropriate sections to lists.";
      }
    }
    
    if (targetFormat === "json") {
      formatInstructions += ` Structure the JSON with an indentation of ${indentationSpaces} spaces.`;
    }

    // Create prompt
    const prompt = `${formatInstructions}\n\nText: ${text}`;

    // Use OpenAI to convert the format
    const response = await generateText(prompt, 1500, 0.1);

    return {
      processedText: response.text,
      original: text,
      processingType: `format-to-${targetFormat}`
    };
  } catch (error) {
    console.error("Text formatting error:", error);
    throw new Error(`Failed to format text: ${error.message}`);
  }
}

// Extract information from text
export async function extractFromText(
  text: string,
  extractionTypes: ("emails" | "urls" | "dates" | "addresses" | "phone_numbers" | "custom")[],
  customPattern?: string
): Promise<TextProcessingResponse & { extracted: Record<string, string[]> }> {
  try {
    let extractionInstructions = "Extract the following information from the text:";
    
    for (const type of extractionTypes) {
      if (type === "custom" && customPattern) {
        extractionInstructions += ` Items matching this pattern: ${customPattern}.`;
      } else {
        extractionInstructions += ` ${type},`;
      }
    }
    
    extractionInstructions = extractionInstructions.replace(/,$/, "."); // Replace trailing comma with period
    
    // Add JSON format instruction
    extractionInstructions += " Return ONLY a JSON object with keys for each extraction type and arrays of extracted items as values.";

    // Create prompt
    const prompt = `${extractionInstructions}\n\nText: ${text}`;

    // Use OpenAI to extract information
    const response = await generateText(prompt, 1000, 0.1);
    
    // Parse the JSON from the response
    let extracted: Record<string, string[]> = {};
    try {
      // Find JSON in the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (error) {
      console.error("Error parsing extraction results:", error);
      extracted = { error: ["Failed to parse extraction results"] };
    }

    return {
      processedText: response.text,
      original: text,
      processingType: "extract",
      extracted
    };
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error(`Failed to extract from text: ${error.message}`);
  }
}

// Translate text
export async function translateText(
  text: string,
  targetLanguage: string,
  options: {
    preserveFormatting?: boolean;
    toneStyle?: "formal" | "casual" | "technical" | "simple";
  } = {}
): Promise<TextProcessingResponse> {
  try {
    // Set default options
    const {
      preserveFormatting = true,
      toneStyle = "formal"
    } = options;

    // Create translation instructions
    let translationInstructions = `Translate the following text to ${targetLanguage}.`;
    
    // Add tone instruction
    switch (toneStyle) {
      case "formal":
        translationInstructions += " Use formal language appropriate for professional contexts.";
        break;
      case "casual":
        translationInstructions += " Use casual, conversational language.";
        break;
      case "technical":
        translationInstructions += " Use technical language appropriate for specialists.";
        break;
      case "simple":
        translationInstructions += " Use simple language that would be easily understood by non-native speakers.";
        break;
    }
    
    // Add formatting instruction
    if (preserveFormatting) {
      translationInstructions += " Preserve the original formatting including paragraphs, lists, and emphasis.";
    }

    // Create prompt
    const prompt = `${translationInstructions}\n\nText: ${text}`;

    // Use OpenAI to translate
    const response = await generateText(prompt, 1500, 0.3);

    return {
      processedText: response.text,
      original: text,
      processingType: `translate-to-${targetLanguage}`
    };
  } catch (error) {
    console.error("Text translation error:", error);
    throw new Error(`Failed to translate text: ${error.message}`);
  }
}