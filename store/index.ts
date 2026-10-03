import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { TenantInfo, User, CaseEvent, ExecutionMode } from "@/types/api";

interface AuthState { status: "loading" | "authed" | "anon"; user: User | null; tenant: TenantInfo | null }
const auth = createSlice({
  name: "auth",
  initialState: { status: "loading", user: null, tenant: null } as AuthState,
  reducers: {
    signedIn: (s, a: PayloadAction<{ user: User; tenant: TenantInfo }>) => { s.status = "authed"; s.user = a.payload.user; s.tenant = a.payload.tenant; },
    signedOut: (s) => { s.status = "anon"; s.user = null; s.tenant = null; },
    modeChanged: (s, a: PayloadAction<ExecutionMode>) => { if (s.tenant) s.tenant.executionMode = a.payload; },
  },
});

export interface LiveItem { id: string; ts: string; caseId?: string; text: string; status: string; system?: string }
interface UiState { sidebarOpen: boolean; paletteOpen: boolean; shortcutsOpen: boolean; live: LiveItem[]; stream: "connecting" | "live" | "offline" }
const ui = createSlice({
  name: "ui",
  initialState: { sidebarOpen: false, paletteOpen: false, shortcutsOpen: false, live: [], stream: "connecting" } as UiState,
  reducers: {
    sidebar: (s, a: PayloadAction<boolean>) => { s.sidebarOpen = a.payload; },
    palette: (s, a: PayloadAction<boolean>) => { s.paletteOpen = a.payload; },
    shortcuts: (s, a: PayloadAction<boolean>) => { s.shortcutsOpen = a.payload; },
    streamState: (s, a: PayloadAction<UiState["stream"]>) => { s.stream = a.payload; },
    liveEvent: (s, a: PayloadAction<CaseEvent>) => {
      const e = a.payload;
      s.live = [{ id: e._id, ts: e.ts, caseId: e.caseId, text: e.action, status: e.status, system: e.system }, ...s.live].slice(0, 40);
    },
  },
});

export const store = configureStore({ reducer: { auth: auth.reducer, ui: ui.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const authActions = auth.actions;
export const uiActions = ui.actions;
