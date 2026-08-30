import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
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
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cropRect } from "../utils/imageCrop";

const SCREEN = Dimensions.get("window");
const AREA_W = SCREEN.width;
const AREA_H = SCREEN.height * 0.62;
const FRAME_PAD = 24; // gutter between the crop frame and the edge of the work area
const MAX_ZOOM = 4;

const clampInt = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(v)));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface Props {
  visible: boolean;
  uri: string;
  imageWidth: number;
  imageHeight: number;
  /** Crop aspect ratio (width / height). Defaults to 1 (square). */
  aspect?: number;
  onCancel: () => void;
  onCrop: (croppedUri: string) => void;
}

/**
 * Photo cropper that mirrors the web app's cropper (partials/photo-cropper):
 * a fixed crop frame locked to a given aspect ratio, with the image draggable
 * behind it and a zoom slider + buttons. The framed region is always fully
 * covered by the image, so the output matches the frame's aspect exactly.
 */
export default function ImageCropModal({
  visible,
  uri,
  imageWidth,
  imageHeight,
  aspect = 1,
  onCancel,
  onCrop,
}: Props) {
  const iW = imageWidth || 1;
  const iH = imageHeight || 1;
  const A = aspect && aspect > 0 ? aspect : 1;

  // Frame geometry: largest rectangle of the target aspect that fits the area.
  const frame = useMemo(() => {
    const availW = AREA_W - FRAME_PAD * 2;
    const availH = AREA_H - FRAME_PAD * 2;
    let FW = availW;
    let FH = FW / A;
    if (FH > availH) {
      FH = availH;
      FW = FH * A;
    }
    const x = (AREA_W - FW) / 2;
    const y = (AREA_H - FH) / 2;
    return { x, y, w: FW, h: FH };
  }, [A]);

  // Base scale that makes the image just cover the frame (zoom = 1).
  const s0 = useMemo(() => {
    const s = Math.max(frame.w / iW, frame.h / iH);
    return isFinite(s) && s > 0 ? s : 1;
  }, [frame.w, frame.h, iW, iH]);

  const dispSize = useCallback(
    (z: number) => ({ w: iW * s0 * z, h: iH * s0 * z }),
    [iW, iH, s0],
  );

  // Keep the image position such that the frame stays fully covered.
  const clampPos = useCallback(
    (x: number, y: number, z: number) => {
      const { w: dw, h: dh } = dispSize(z);
      const minX = frame.x + frame.w - dw;
      const minY = frame.y + frame.h - dh;
      return {
        x: clamp(x, minX, frame.x),
        y: clamp(y, minY, frame.y),
      };
    },
    [dispSize, frame],
  );

  const initialPos = useCallback(
    (z: number) => {
      const { w: dw, h: dh } = dispSize(z);
      return clampPos(frame.x + (frame.w - dw) / 2, frame.y + (frame.h - dh) / 2, z);
    },
    [dispSize, clampPos, frame],
  );

  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState(() => initialPos(1));
  const [cropping, setCropping] = useState(false);

  const zoomRef = useRef(1);
  const posRef = useRef(pos);
  const panStart = useRef(pos);

  // Reset whenever a new image is opened.
  useEffect(() => {
    const p = initialPos(1);
    zoomRef.current = 1;
    posRef.current = p;
    setZoom(1);
    setPos(p);
  }, [uri, initialPos]);

  const applyPos = (x: number, y: number) => {
    const p = clampPos(x, y, zoomRef.current);
    posRef.current = p;
    setPos(p);
  };

  // Zoom about the frame's centre so the framed subject stays put.
  const applyZoom = (z2: number) => {
    const z = clamp(z2, 1, MAX_ZOOM);
    const fcx = frame.x + frame.w / 2;
    const fcy = frame.y + frame.h / 2;
    const cur = dispSize(zoomRef.current);
    const nx = (fcx - posRef.current.x) / cur.w;
    const ny = (fcy - posRef.current.y) / cur.h;
    const next = dispSize(z);
    const p = clampPos(fcx - nx * next.w, fcy - ny * next.h, z);
    zoomRef.current = z;
    posRef.current = p;
    setZoom(z);
    setPos(p);
  };

  const imagePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStart.current = { ...posRef.current };
      },
      onPanResponderMove: (_, gs) => {
        applyPos(panStart.current.x + gs.dx, panStart.current.y + gs.dy);
      },
    }),
  ).current;

  // ── Zoom slider ────────────────────────────────────────────────────────────
  const trackW = useRef(1);
  const sliderStartPx = useRef(0);
  const [thumbPx, setThumbPx] = useState(0);

  const zoomToThumb = (z: number) =>
    ((z - 1) / (MAX_ZOOM - 1)) * trackW.current;

  useEffect(() => {
    setThumbPx(zoomToThumb(zoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const sliderPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sliderStartPx.current = zoomToThumb(zoomRef.current);
      },
      onPanResponderMove: (_, gs) => {
        const px = clamp(sliderStartPx.current + gs.dx, 0, trackW.current);
        const z = 1 + (px / trackW.current) * (MAX_ZOOM - 1);
        setThumbPx(px);
        applyZoom(z);
      },
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackW.current = e.nativeEvent.layout.width || 1;
    setThumbPx(zoomToThumb(zoomRef.current));
  };

  const nudgeZoom = (dir: number) =>
    applyZoom(zoomRef.current + dir * ((MAX_ZOOM - 1) / 10));

  const handleCrop = async () => {
    setCropping(true);
    try {
      const z = zoomRef.current;
      const scale = s0 * z;
      const originX = clampInt((frame.x - posRef.current.x) / scale, 0, iW - 1);
      const originY = clampInt((frame.y - posRef.current.y) / scale, 0, iH - 1);
      const w = clampInt(frame.w / scale, 1, iW - originX);
      const h = clampInt(frame.h / scale, 1, iH - originY);
      const cropped = await cropRect(uri, originX, originY, w, h);
      onCrop(cropped);
    } catch {
      onCrop(uri);
    } finally {
      setCropping(false);
    }
  };

  const disp = dispSize(zoom);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <StatusBar barStyle="light-content" />
      <View style={s.root}>
        <Text style={s.hint}>Drag to reposition · pinch the slider to zoom</Text>

        {/* Image + crop overlay */}
        <View style={{ width: AREA_W, height: AREA_H }} {...imagePan.panHandlers}>
          {!!uri && (
            <Image
              source={{ uri }}
              style={{ position: "absolute", left: pos.x, top: pos.y, width: disp.w, height: disp.h }}
              resizeMode="cover"
            />
          )}

          {/* dim mask around the frame */}
          <View style={[s.dim, { top: 0, left: 0, right: 0, height: frame.y }]} />
          <View style={[s.dim, { top: frame.y + frame.h, left: 0, right: 0, bottom: 0 }]} />
          <View style={[s.dim, { top: frame.y, left: 0, width: frame.x, height: frame.h }]} />
          <View style={[s.dim, { top: frame.y, left: frame.x + frame.w, right: 0, height: frame.h }]} />

          {/* frame border + thirds grid + corners (non-interactive) */}
          <View pointerEvents="none" style={{ position: "absolute", left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
            <View style={[s.border, { top: 0, left: 0, right: 0, height: 2 }]} />
            <View style={[s.border, { bottom: 0, left: 0, right: 0, height: 2 }]} />
            <View style={[s.border, { left: 0, top: 0, bottom: 0, width: 2 }]} />
            <View style={[s.border, { right: 0, top: 0, bottom: 0, width: 2 }]} />

            <View style={[s.grid, { left: "33.3%", top: 0, bottom: 0, width: 1 }]} />
            <View style={[s.grid, { left: "66.6%", top: 0, bottom: 0, width: 1 }]} />
            <View style={[s.grid, { top: "33.3%", left: 0, right: 0, height: 1 }]} />
            <View style={[s.grid, { top: "66.6%", left: 0, right: 0, height: 1 }]} />

            <View style={[s.corner, { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[s.corner, { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[s.corner, { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[s.corner, { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>
        </View>

        {/* controls */}
        <View style={s.controls}>
          <View style={s.zoomRow}>
            <TouchableOpacity style={s.zoomBtn} onPress={() => nudgeZoom(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.track} onLayout={onTrackLayout} {...sliderPan.panHandlers}>
              <View style={s.trackFill} />
              <View style={[s.thumb, { left: clamp(thumbPx - 11, -2, AREA_W) }]} />
            </View>
            <TouchableOpacity style={s.zoomBtn} onPress={() => nudgeZoom(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.row}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} disabled={cropping}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.useBtn} onPress={handleCrop} disabled={cropping}>
              {cropping ? <ActivityIndicator color="#fff" /> : <Text style={s.useTxt}>Use Photo</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", paddingVertical: 18 },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.55)" },
  border: { position: "absolute", backgroundColor: "#fff" },
  grid: { position: "absolute", backgroundColor: "rgba(255,255,255,0.25)" },
  corner: { position: "absolute", width: 22, height: 22, borderColor: "#fff" },

  controls: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 20 },
  zoomRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  zoomBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  track: { flex: 1, height: 22, justifyContent: "center" },
  trackFill: { height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)" },
  thumb: {
    position: "absolute", top: 0, width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#fff", borderWidth: 3, borderColor: "#0F5C3A",
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },
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
