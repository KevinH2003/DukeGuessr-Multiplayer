export function validateRequestBody(body: any, requiredAttributes: string[]): boolean {
    console.log(body)
    return requiredAttributes.every(attr => attr in body);
}