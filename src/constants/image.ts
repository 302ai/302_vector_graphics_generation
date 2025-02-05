import { Color } from "@/stores";

export const presetsColors: { [key: string]: Color[] } = {
    '550e8400-e29b-41d4-a716-446655440000': [
        { r: 68, g: 23, b: 82, a: 1 },
        { r: 129, g: 116, b: 160, a: 1 },
        { r: 168, g: 136, b: 181, a: 1 },
        { r: 239, g: 182, b: 200, a: 1 },
    ],
    '123e4567-e89b-12d3-a456-426614174000': [
        { r: 223, g: 242, b: 235, a: 1 },
        { r: 185, g: 229, b: 232, a: 1 },
        { r: 122, g: 178, b: 211, a: 1 },
        { r: 74, g: 98, b: 138, a: 1 },
    ],
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8': [
        { r: 248, g: 244, b: 225, a: 1 },
        { r: 175, g: 143, b: 111, a: 1 },
        { r: 116, g: 81, b: 45, a: 1 },
        { r: 84, g: 51, b: 16, a: 1 },
    ],
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8': [
        { r: 93, g: 135, b: 54, a: 1 },
        { r: 128, g: 157, b: 60, a: 1 },
        { r: 169, g: 196, b: 108, a: 1 },
        { r: 244, g: 255, b: 195, a: 1 },
    ],
    '6ba7b812-9dad-11d1-80b4-00c04fd430c8': [
        { r: 255, g: 131, b: 131, a: 1 },
        { r: 255, g: 245, b: 116, a: 1 },
        { r: 161, g: 214, b: 203, a: 1 },
        { r: 161, g: 154, b: 211, a: 1 },
    ],
    '6ba7b813-9dad-11d1-80b4-00c04fd430c8': [
        { r: 100, g: 13, b: 95, a: 1 },
        { r: 217, g: 22, b: 86, a: 1 },
        { r: 235, g: 91, b: 0, a: 1 },
        { r: 255, g: 178, b: 0, a: 1 },
    ],
}

// export const siezList = [
//     { value: '1024x1024', label: '1024x1024' },
//     { value: '1365x1024', label: '1365x1024' },
//     { value: '1024x1365', label: '1024x1365' },
//     { value: '1536x1024', label: '1536x1024' },
//     { value: '1024x1536', label: '1024x1536' },
//     { value: '1820x1024', label: '1820x1024' },
//     { value: '1024x1820', label: '1024x1820' },
//     { value: '1024x2048', label: '1024x2048' },
//     { value: '2048x1024', label: '2048x1024' },
//     { value: '1434x1024', label: '1434x1024' },
//     { value: '1024x1434', label: '1024x1434' },
//     { value: '1024x1280', label: '1024x1280' },
//     { value: '1280x1024', label: '1280x1024' },
//     { value: '1024x1707', label: '1024x1707' },
//     { value: '1707x1024', label: '1707x1024' },
// ]

function calculateAspectRatio(size: string): string {
    const [width, height] = size.split('x').map(Number);
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

export const siezList = [
    { value: '1024x1024', label: '1:1' },
    { value: '1024x2048', label: '1:2' },
    { value: '2048x1024', label: '2:1' },
    { value: '1024x1536', label: '2:3' },
    { value: '1536x1024', label: '3:2' },
    { value: '1024x1365', label: '3:4' },
    { value: '1024x1707', label: '3:5' },
    { value: '1280x1024', label: '5:4' },
    { value: '1707x1024', label: '5:3' },
    { value: '1024x1280', label: '4:5' },
    { value: '1365x1024', label: '4:3' },
    { value: '1024x1820', label: '9:16' },
    { value: '1820x1024', label: '16:9' },
    { value: '1024x1434', label: '512:717' },
    { value: '1434x1024', label: '717:512' },
]
