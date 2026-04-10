import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  PanResponder,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { cropRect } from "../utils/imageCrop";

const SCREEN = Dimensions.get("window");
const AREA_W = SCREEN.width;
const AREA_H = SCREEN.height * 0.72;
const BTN_H = SCREEN.height - AREA_H;

function getContained(imgW: number, imgH: number) {
  const scale = Math.min(AREA_W / imgW, AREA_H / imgH);
  return { dispW: imgW * scale, dispH: imgH * scale, scale };
}

interface Props {
  visible: boolean;
  uri: string;
  imageWidth: number;
  imageHeight: number;
  onCancel: () => void;
  onCrop: (croppedUri: string) => void;
}

export default function ImageCropModal({
  visible,
  uri,
  imageWidth,
  imageHeight,
  onCancel,
  onCrop,
}: Props) {
  const { dispW, dispH, scale } = useMemo(
    () => getContained(imageWidth || 1, imageHeight || 1),
    [imageWidth, imageHeight],
  );

  const CROP_SIZE = useMemo(() => Math.min(dispW, dispH) * 0.88, [dispW, dispH]);
  const imgOriginX = useMemo(() => (AREA_W - dispW) / 2, [dispW]);
  const imgOriginY = useMemo(() => (AREA_H - dispH) / 2, [dispH]);
  const minX = imgOriginX;
  const maxX = imgOriginX + dispW - CROP_SIZE;
  const minY = imgOriginY;
  const maxY = imgOriginY + dispH - CROP_SIZE;

  const initPos = useMemo(
    () => ({ x: (AREA_W - CROP_SIZE) / 2, y: (AREA_H - CROP_SIZE) / 2 }),
    [CROP_SIZE],
  );

  const boxRef = useRef(initPos);
  const gestureStart = useRef(initPos);
  const limitsRef = useRef({ minX, maxX, minY, maxY });
  const [boxPos, setBoxPos] = useState(initPos);
  const [cropping, setCropping] = useState(false);

  useEffect(() => {
    limitsRef.current = { minX, maxX, minY, maxY };
    boxRef.current = initPos;
    gestureStart.current = initPos;
    setBoxPos(initPos);
  }, [uri, initPos, minX, maxX, minY, maxY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        gestureStart.current = { ...boxRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const { minX: lx, maxX: rx, minY: ly, maxY: ry } = limitsRef.current;
        const nx = Math.max(lx, Math.min(rx, gestureStart.current.x + gs.dx));
        const ny = Math.max(ly, Math.min(ry, gestureStart.current.y + gs.dy));
        boxRef.current = { x: nx, y: ny };
        setBoxPos({ x: nx, y: ny });
      },
    }),
  ).current;

  const handleCrop = async () => {
    setCropping(true);
    try {
      const originX = Math.max(0, Math.round((boxRef.current.x - imgOriginX) / scale));
      const originY = Math.max(0, Math.round((boxRef.current.y - imgOriginY) / scale));
      const size = Math.round(CROP_SIZE / scale);
      const safeW = Math.min(size, imageWidth - originX);
      const safeH = Math.min(size, imageHeight - originY);
      const cropped = await cropRect(uri, originX, originY, safeW, safeH);
      onCrop(cropped);
    } catch {
      onCrop(uri);
    } finally {
      setCropping(false);
    }
  };

  const bx = boxPos.x;
  const by = boxPos.y;
  const cs = CROP_SIZE;
  const CORNER = 22;
  const BORDER = 2;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.root}>
        <Text style={s.hint}>Drag to reposition</Text>

        {/* Image + overlay area */}
        <View style={{ width: AREA_W, height: AREA_H }}>
          {!!uri && (
            <Image
              source={{ uri }}
              style={{ position: "absolute", left: imgOriginX, top: imgOriginY, width: dispW, height: dispH }}
              resizeMode="contain"
            />
          )}

          {/* dim overlays */}
          <View style={[s.dim, { top: 0, left: 0, right: 0, height: by }]} />
          <View style={[s.dim, { top: by + cs, left: 0, right: 0, bottom: 0 }]} />
          <View style={[s.dim, { top: by, left: 0, width: bx, height: cs }]} />
          <View style={[s.dim, { top: by, left: bx + cs, right: 0, height: cs }]} />

          {/* crop box — draggable */}
          <View
            {...panResponder.panHandlers}
            style={{ position: "absolute", left: bx, top: by, width: cs, height: cs }}
          >
            {/* border */}
            <View style={[s.border, { top: 0, left: 0, right: 0, height: BORDER }]} />
            <View style={[s.border, { bottom: 0, left: 0, right: 0, height: BORDER }]} />
            <View style={[s.border, { left: 0, top: 0, bottom: 0, width: BORDER }]} />
            <View style={[s.border, { right: 0, top: 0, bottom: 0, width: BORDER }]} />

            {/* grid thirds */}
            <View style={[s.grid, { left: "33.3%", top: 0, bottom: 0, width: 1 }]} />
            <View style={[s.grid, { left: "66.6%", top: 0, bottom: 0, width: 1 }]} />
            <View style={[s.grid, { top: "33.3%", left: 0, right: 0, height: 1 }]} />
            <View style={[s.grid, { top: "66.6%", left: 0, right: 0, height: 1 }]} />

            {/* corner handles */}
            <View style={[s.corner, { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, width: CORNER, height: CORNER }]} />
            <View style={[s.corner, { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, width: CORNER, height: CORNER }]} />
            <View style={[s.corner, { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, width: CORNER, height: CORNER }]} />
            <View style={[s.corner, { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, width: CORNER, height: CORNER }]} />
          </View>
        </View>

        {/* buttons */}
        <View style={[s.row, { height: BTN_H }]}>
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel} disabled={cropping}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.useBtn} onPress={handleCrop} disabled={cropping}>
            {cropping
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.useTxt}>Use Photo</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", paddingVertical: 10 },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.55)" },
  border: { position: "absolute", backgroundColor: "#fff" },
  grid: { position: "absolute", backgroundColor: "rgba(255,255,255,0.25)" },
  corner: { position: "absolute", borderColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  cancelTxt: { color: "#fff", fontSize: 15, fontWeight: "600" },
  useBtn: {
    flex: 2, height: 48, borderRadius: 10, backgroundColor: "#0F5C3A",
    alignItems: "center", justifyContent: "center",
  },
  useTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
