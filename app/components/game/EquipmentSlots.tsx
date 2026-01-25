"use client";

import { Item } from "@/app/types";

const slots = {
    HEAD: 1,
    HAND: 2,
    CHEST: 1,
    LEGS: 1,
    FEET: 1,
    RING: 2,
};

interface EquipmentSlotsProps {
    inventory: Item[];
    onUnequip: (item: Item) => void;
}

export default function EquipmentSlots({ inventory, onUnequip }: EquipmentSlotsProps) {
    const equippedItems = inventory.filter((i) => i.equipped);

    const renderSlots = (placement: keyof typeof slots) => {
        const numSlots = slots[placement];
        const itemsInPlacement = equippedItems.filter(
            (item) => item.placement === placement,
        );

        return Array.from({ length: numSlots }).map((_, index) => {
            const itemInSlot = itemsInPlacement.find((item) => (item.slot || 0) === index);
            return (
                <div
                    key={`${placement}-${index}`}
                    className="p-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-700 flex items-center justify-center text-center relative"
                    onClick={() => itemInSlot && onUnequip(itemInSlot)}>
                    {itemInSlot ? (
                        <>
                            <div className="text-2xl">{itemInSlot.emoji}</div>
                            <div className="absolute -bottom-2 text-[10px] bg-gray-900 px-1 rounded">
                                {itemInSlot.name}
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-600 text-xs">{placement}</span>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-300 mb-2">Equipment</h3>
            <div className="grid grid-cols-4 gap-2 bg-gray-900/50 p-2 rounded-lg">
                <div className="col-span-1 space-y-2">
                    {renderSlots("HAND")}
                </div>
                <div className="col-span-2 space-y-2">
                    {renderSlots("HEAD")}
                    {renderSlots("CHEST")}
                    {renderSlots("LEGS")}
                    {renderSlots("FEET")}
                </div>
                <div className="col-span-1 space-y-2">
                    {renderSlots("RING")}
                </div>
            </div>
        </div>
    );
}
