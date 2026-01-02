export const STORAGE_PACKS = {
  extra_5: {
    name: "저장 공간 +5",
    description: "5개의 추가 저장 공간",
    price: 2900, // 2,900원 (KRW)
    currency: "krw",
    slots: 5,
  },
  extra_10: {
    name: "저장 공간 +10",
    description: "10개의 추가 저장 공간",
    price: 4900, // 4,900원 (KRW)
    currency: "krw",
    slots: 10,
  },
  unlimited: {
    name: "무제한 저장",
    description: "무제한 저장 공간 (평생)",
    price: 9900, // 9,900원 (KRW)
    currency: "krw",
    slots: -1, // unlimited
  },
} as const;

export type StoragePackType = keyof typeof STORAGE_PACKS;
