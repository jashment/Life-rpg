"use client";

import { Item } from "@/app/types";
import { equipItem, unequipItem } from "@/lib/item-actions";
import EquipmentSlots from "./EquipmentSlots";

interface InventoryProps {
    inventory: Item[];
    onClose: () => void;
    userId: string;
    refetch: () => void;
}

export default function Inventory({
    inventory,
    onClose,
    userId,
    refetch,
}: InventoryProps) {
    const handleEquip = async (item: Item, slot: number) => {
        if (!item.placement) {
            alert("This item cannot be equipped.");
            return;
        }
        await equipItem(userId, item.id, item.placement, slot);
        refetch();
    };

    const handleUnequip = async (item: Item) => {
        await unequipItem(userId, item.id);
        refetch();
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        Inventory
                    </h2>
                    <button onClick={onClose} className="text-gray-400 text-2xl">
                        ✕
                    </button>
                </div>

                <EquipmentSlots inventory={inventory} onUnequip={handleUnequip} />

                <h3 className="text-lg font-bold text-gray-300 mb-2">
                    Your Items ({inventory.length})
                </h3>
                {inventory.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        Your bag is empty. Complete quests to find loot!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {inventory.map((item) => (
                            <div
                                key={item.id}
                                className={`p-3 rounded-lg border bg-gray-900/50 flex flex-col items-center text-center gap-2 relative ${item.equipped ? "border-purple-500" : "border-gray-800"
                                }`}>
                                {item.equipped && <div className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-bold">E</div>}
                                <div className="text-3xl">{item.emoji}</div>
                                <div className="text-sm font-bold truncate w-full">
                                    {item.name}
                                </div>
                                <div
                                    className={`text-[10px] uppercase font-mono ${item.rarity === "LEGENDARY"
                                        ? "text-orange-400"
                                        : item.rarity === "EPIC"
                                            ? "text-purple-400"
                                            : item.rarity === "RARE"
                                                ? "text-blue-400"
                                                : "text-gray-500"
                                    }`}>
                                    {item.rarity} - {item.placement}
                                </div>
                                <div className="text-[10px] font-bold text-yellow-500">
                                    ⚡ {item.power}
                                </div>
                                {item.equipped ? (
                                    <button onClick={() => handleUnequip(item)} className="w-full mt-2 bg-gray-700 text-white text-xs py-1 rounded-lg">
                                        Unequip
                                    </button>
                                ) : (
                                    <div className="flex gap-1 w-full mt-2">
                                        {item.placement === "RING" || item.placement === "HAND" ? (
                                            <>
                                                <button onClick={() => handleEquip(item, 0)} className="w-1/2 bg-purple-600 text-white text-xs py-1 rounded-lg">L</button>
                                                <button onClick={() => handleEquip(item, 1)} className="w-1/2 bg-purple-600 text-white text-xs py-1 rounded-lg">R</button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleEquip(item, 0)} className="w-full bg-purple-600 text-white text-xs py-1 rounded-lg">
                                                Equip
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
