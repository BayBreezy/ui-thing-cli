/**
 * Helper function used to get auto complete suggestions for Tailwind CSS classes.
 */
export const TW_HELPER = `/**
 * Utility function to return Tailwind CSS classes.
 */
export const tw = <T extends TemplateStringsArray | string>(tailwindClasses: T) => tailwindClasses;
`;
