import * as ImageManipulator from "expo-image-manipulator";

export async function centerCropToSquare(uri: string, w: number, h: number): Promise<string> {
  const side = Math.min(w, h);
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX: Math.floor((w - side) / 2), originY: Math.floor((h - side) / 2), width: side, height: side } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
