import { create } from 'zustand';
import { getChain } from '../utils/tool';

interface ManorState {
    // 购买相关状态
    isPurchasing: boolean;
    purchaseError: string | null;
    
    // 操作方法
    purchaseManorAccess: () => Promise<boolean>;
    clearPurchaseError: () => void;
}

export const useManorStore = create<ManorState>((set) => ({
    // 初始状态
    isPurchasing: false,
    purchaseError: null,

    // 购买庄园访问权限
    purchaseManorAccess: async () => {
        const chain = getChain();
        if (!chain) {
            set({ purchaseError: "钱包环境不可用" });
            return false;
        }

        set({ isPurchasing: true, purchaseError: null });
        
        try {
            await chain.purchaseManorAccess();
            set({ isPurchasing: false });
            return true;
        } catch (error) {
            console.error("购买庄园访问权限失败:", error);
            set({ 
                purchaseError: `购买失败: ${error}`,
                isPurchasing: false 
            });
            return false;
        }
    },

    // 清除购买错误
    clearPurchaseError: () => {
        set({ purchaseError: null });
    }
}));