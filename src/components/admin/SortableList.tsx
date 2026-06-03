"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode } from "react";

type SortableListProps<T> = {
  items: T[];
  getItemId: (item: T, index: number) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, dragHandle: ReactNode) => ReactNode;
  className?: string;
  itemClassName?: string;
};

function SortableRow<T>({
  id,
  item,
  index,
  itemClassName,
  renderItem,
}: {
  id: string;
  item: T;
  index: number;
  itemClassName?: string;
  renderItem: SortableListProps<T>["renderItem"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="admin-sortable-handle"
      aria-label="拖拽排序"
      {...attributes}
      {...listeners}
    >
      ⋮⋮
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={itemClassName}
      data-sortable-id={id}
    >
      {renderItem(item, index, dragHandle)}
    </li>
  );
}

export default function SortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  className,
  itemClassName,
}: SortableListProps<T>) {
  const ids = items.map((item, index) => getItemId(item, index));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item, index) => (
            <SortableRow
              key={getItemId(item, index)}
              id={getItemId(item, index)}
              item={item}
              index={index}
              itemClassName={itemClassName}
              renderItem={renderItem}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
