import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DatabaseConnection } from '../types/connection';

interface ConnectionStore {
  connections: DatabaseConnection[];
  selectedConnectionId: string | null;
  setConnections: (connections: DatabaseConnection[]) => void;
  addConnection: (connection: DatabaseConnection) => void;
  updateConnection: (id: string, connection: DatabaseConnection) => void;
  removeConnection: (id: string) => void;
  selectConnection: (id: string | null) => void;
  getSelectedConnection: () => DatabaseConnection | null;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      connections: [],
      selectedConnectionId: null,

      setConnections: (connections) => set({ connections }),

      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      updateConnection: (id, connection) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? connection : c
          ),
        })),

      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          selectedConnectionId:
            state.selectedConnectionId === id ? null : state.selectedConnectionId,
        })),

      selectConnection: (id) => set({ selectedConnectionId: id }),

      getSelectedConnection: () => {
        const state = get();
        return (
          state.connections.find((c) => c.id === state.selectedConnectionId) ||
          null
        );
      },
    }),
    {
      name: 'sqlbox-connections',
    }
  )
);
