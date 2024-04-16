export function validateRequestBody(body: any, requiredAttributes: string[]): boolean {
    return requiredAttributes.every(attr => attr in body);
}