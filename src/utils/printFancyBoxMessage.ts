import boxen, { Options as BoxOptions } from "boxen";
import figlet from "figlet";

/**
 * Extra configuration options for the fancy box.
 */
interface FancyBoxOptions {
  box?: BoxOptions; // Overrides for boxen (border style, color, etc.)
  figletFont?: figlet.Fonts; // Optional font name for ASCII art
}

/**
 * Creates the ASCII-art box as a string (pure function — does not log).
 * Useful for testing because it avoids side effects like console output.
 *
 * @param title - The main text to display in big ASCII font
 * @param description - Optional subtitle or extra info below the box
 * @param options - Styling and font configuration
 * @returns A fully formatted string with ASCII title inside a box
 */
const createFancyBoxMessage = (
  title: string,
  description?: string,
  options: FancyBoxOptions = {}
): string => {
  const { box, figletFont } = options;

  // Generate the ASCII art title using figlet
  const asciiTitle = figlet.textSync(title, {
    font: figletFont || "Standard", // Default font if none provided
  });

  // Default box styling so all boxes look consistent
  const defaultBoxOptions: BoxOptions = {
    borderColor: "greenBright",
    padding: 1,
    borderStyle: "round",
    titleAlignment: "center",
  };

  // Wrap ASCII art in a decorative box
  const boxMessage = boxen(asciiTitle, {
    ...defaultBoxOptions, // Base styles
    ...box, // User overrides
  });

  // Append description if provided
  return description ? `${boxMessage}\n${description}` : boxMessage;
};

/**
 * CLI-friendly helper that prints the fancy box directly to the terminal.
 * This simply calls `createFancyBoxMessage` and logs the result.
 *
 * @param title - The main title to display
 * @param description - Optional extra info under the box
 * @param options - Font and box customization
 */
export const printFancyBoxMessage = (
  title: string,
  description?: string,
  options?: FancyBoxOptions
) => {
  console.log("\n" + createFancyBoxMessage(title, description, options));
};
