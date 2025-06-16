export const getSafeData = <T extends object>(data: T[]) => {
    return data.map(item => {
        const safeItem = { ...item };
        (Object.keys(safeItem) as (keyof T)[]).forEach(key => {
            if (key === "password" || key === "deletedBy" || key === "deletedAt" || key === "isDeleted") {
                delete safeItem[key];
            }
        });
        return safeItem;
    });
};