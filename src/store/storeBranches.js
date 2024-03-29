import { create } from 'zustand';

const useStoreBranchesStore = create((set) => ({
  isUpdate: false,
  storeBranchActive: { id: 0, name: 'N/A' },
  storeBranches: [],
  setIsUpdate: (isUpdate) => set({ isUpdate }),
  setStoreBranches: (storeBranches) => set({ storeBranches }),
  setStoreBranchActive: (storeBranchActive) => set({ storeBranchActive }),
}));

export default useStoreBranchesStore;
