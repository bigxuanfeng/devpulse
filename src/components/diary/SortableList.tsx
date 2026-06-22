"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  items: string[];
  onReorder: (newOrder: string[]) => void;
  renderItem: (item: string) => React.ReactNode;
  id?: string;
}

export function SortableList({ items, onReorder, renderItem }: Props) {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...items];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newOrder = [...items];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorder(newOrder);
  };

  return (
    <>
      {items.map((item, index) => (
        <div key={item} className="flex items-center group/item">
          <div className="flex flex-col opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 mr-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); moveUp(index); }}
              disabled={index === 0}
              className="p-0 text-text-muted hover:text-text-secondary disabled:opacity-20 transition-colors duration-150 leading-none"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveDown(index); }}
              disabled={index === items.length - 1}
              className="p-0 text-text-muted hover:text-text-secondary disabled:opacity-20 transition-colors duration-150 leading-none"
            >
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="flex-1 min-w-0">{renderItem(item)}</div>
        </div>
      ))}
    </>
  );
}
